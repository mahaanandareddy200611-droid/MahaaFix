const crypto = require("node:crypto");

const QUEUE_EVENT_JOB_NAME = "OUTBOX_EVENT";

function calculateRetryDelayMs(
    attempt,
    {
        baseDelayMs = 1000,
        maxDelayMs = 60_000,
        random = Math.random,
    } = {}
) {
    if (!Number.isInteger(attempt) || attempt < 1) {
        throw new TypeError(
            "attempt must be a positive integer"
        );
    }

    if (
        !Number.isFinite(baseDelayMs) ||
        baseDelayMs <= 0 ||
        !Number.isFinite(maxDelayMs) ||
        maxDelayMs <= 0
    ) {
        throw new TypeError(
            "Retry delays must be positive numbers"
        );
    }

    const randomValue = random();

    if (
        !Number.isFinite(randomValue) ||
        randomValue < 0 ||
        randomValue > 1
    ) {
        throw new RangeError(
            "random must return a number between 0 and 1"
        );
    }

    const exponentialDelay = Math.min(
        maxDelayMs,
        baseDelayMs * (2 ** Math.min(attempt - 1, 30))
    );

    // Jitter spreads retries over a range of 50%-100%
    // of the calculated exponential delay.
    return Math.floor(
        exponentialDelay * (0.5 + randomValue * 0.5)
    );
}


function getSafeErrorCode(error) {
    if (typeof error?.code === "string") {
        return error.code.slice(0, 120);
    }

    if (typeof error?.name === "string") {
        return error.name.slice(0, 120);
    }

    return "OUTBOX_PUBLISH_FAILED";
}


function createOutboxRelay({
    OutBox,
    eventQueue,

    instanceId = `outbox-relay-${process.pid}`,

    leaseMs = 30_000,
    maxAttempts = 8,

    baseRetryDelayMs = 1000,
    maxRetryDelayMs = 60_000,

    now = () => new Date(),
    random = Math.random,

    logger = console,
}) {
    if (
        !OutBox ||
        typeof OutBox.findOneAndUpdate !== "function" ||
        typeof OutBox.updateOne !== "function" ||
        typeof OutBox.updateMany !== "function"
    ) {
        throw new TypeError(
            "OutBox must provide the required Mongoose methods"
        );
    }

    if (
        !eventQueue ||
        typeof eventQueue.add !== "function"
    ) {
        throw new TypeError(
            "eventQueue.add must be a function"
        );
    }

    if (
        !Number.isFinite(leaseMs) ||
        leaseMs <= 0 ||
        !Number.isInteger(maxAttempts) ||
        maxAttempts < 1
    ) {
        throw new TypeError(
            "Invalid relay lease or maximum attempts"
        );
    }


    async function recoverExhaustedClaims() {
        const currentTime = now();

        const staleBefore = new Date(
            currentTime.getTime() - leaseMs
        );

        const result = await OutBox.updateMany(
            {
                status: "PROCESSING",

                lockedAt: {
                    $lte: staleBefore,
                },

                attempts: {
                    $gte: maxAttempts,
                },
            },
            {
                $set: {
                    status: "FAILED",

                    lockedAt: null,
                    lockedBy: null,

                    lastError:
                        "RELAY_LEASE_EXPIRED_MAX_ATTEMPTS",
                },
            }
        );

        return result.modifiedCount ?? 0;
    }


    async function claimNextEvent() {
        const currentTime = now();

        const staleBefore = new Date(
            currentTime.getTime() - leaseMs
        );

        // Move stale claims that have exhausted their retries
        // into a terminal failure state.
        await recoverExhaustedClaims();

        // Each claim receives a unique token. That prevents an
        // older relay attempt from updating a newer claim.
        const claimToken =
            `${instanceId}-${crypto.randomUUID()}`;

        const event = await OutBox.findOneAndUpdate(
            {
                $or: [
                    {
                        status: {
                            $in: ["PENDING", "FAILED"],
                        },

                        availableAt: {
                            $lte: currentTime,
                        },

                        attempts: {
                            $lt: maxAttempts,
                        },
                    },

                    {
                        status: "PROCESSING",

                        lockedAt: {
                            $lte: staleBefore,
                        },

                        attempts: {
                            $lt: maxAttempts,
                        },
                    },
                ],
            },
            {
                $set: {
                    status: "PROCESSING",
                    lockedAt: currentTime,
                    lockedBy: claimToken,
                },

                $inc: {
                    attempts: 1,
                },
            },
            {
                new: true,

                sort: {
                    availableAt: 1,
                    createdAt: 1,
                },
            }
        );

        if (!event) {
            return null;
        }

        return {
            event,
            claimToken,
        };
    }


    async function recordPublishFailure(
        event,
        claimToken,
        error
    ) {
        const exhausted =
            event.attempts >= maxAttempts;

        const retryDelayMs = exhausted
            ? 0
            : calculateRetryDelayMs(
                event.attempts,
                {
                    baseDelayMs: baseRetryDelayMs,
                    maxDelayMs: maxRetryDelayMs,
                    random,
                }
            );

        const retryAt = new Date(
            now().getTime() + retryDelayMs
        );

        const result = await OutBox.updateOne(
            {
                _id: event._id,
                status: "PROCESSING",
                lockedBy: claimToken,
            },
            {
                $set: {
                    status: exhausted
                        ? "FAILED"
                        : "PENDING",

                    availableAt: retryAt,

                    lockedAt: null,
                    lockedBy: null,

                    lastError: getSafeErrorCode(error),
                },
            }
        );

        if (!result.matchedCount) {
            logger.warn(
                "[OutboxRelay] Failure recorded by neither "
                + "this claim nor a valid current owner",
                {
                    outboxId: String(event._id),
                }
            );
        }

        return {
            exhausted,
            retryDelayMs,
        };
    }


    async function relayOne() {
        const claim = await claimNextEvent();

        if (!claim) {
            return {
                state: "idle",
            };
        }

        const {
            event,
            claimToken,
        } = claim;

        const outboxId = String(event._id);

        try {
            // Pass only event metadata through Redis.
            // The consumer can load the durable Outbox record
            // when it needs the full event details.
            //
            // This avoids blindly copying potentially sensitive
            // customer data into the queue payload.
            await eventQueue.add(
                QUEUE_EVENT_JOB_NAME,
                {
                    outboxId,

                    eventType: event.eventType,

                    aggregateType: event.aggregateType,

                    aggregateId: String(
                        event.aggregateId
                    ),
                },
                {
                    // Stable, non-numeric job ID.
                    jobId: `outbox-${outboxId}`,
                }
            );
        } catch (error) {
            const failure = await recordPublishFailure(
                event,
                claimToken,
                error
            );

            logger.error(
                "[OutboxRelay] Queue publication failed",
                {
                    outboxId,
                    eventType: event.eventType,
                    errorCode: getSafeErrorCode(error),
                    exhausted: failure.exhausted,
                }
            );

            return {
                state: failure.exhausted
                    ? "failed"
                    : "retry-scheduled",

                outboxId,

                retryDelayMs: failure.retryDelayMs,
            };
        }


        // Publication succeeded. Only mark the event PUBLISHED
        // if this relay still owns the claim.
        //
        // If this database update fails after queue publication,
        // leave the claim recoverable. Re-publication will use
        // the same stable BullMQ job ID.
        const result = await OutBox.updateOne(
            {
                _id: event._id,
                status: "PROCESSING",
                lockedBy: claimToken,
            },
            {
                $set: {
                    status: "PUBLISHED",

                    publishedAt: now(),

                    lockedAt: null,
                    lockedBy: null,

                    lastError: null,
                },
            }
        );

        if (!result.matchedCount) {
            logger.warn(
                "[OutboxRelay] Event published, but this "
                + "relay no longer owns the claim",
                {
                    outboxId,
                }
            );

            return {
                state: "published-claim-lost",
                outboxId,
            };
        }

        return {
            state: "published",
            outboxId,
            eventType: event.eventType,
        };
    }


    return {
        claimNextEvent,
        recoverExhaustedClaims,
        relayOne,
    };
}


module.exports = {
    QUEUE_EVENT_JOB_NAME,
    calculateRetryDelayMs,
    createOutboxRelay,
};