const crypto = require("node:crypto");

const OutBox = require("../../models/OutBox");

const OutboxInbox = require(
    "../../models/OutboxInbox"
);

const {
    withTransaction,
} = require("../transactions/transaction");

const {
    calculateRetryDelayMs,
} = require("./outbox-relay.service");


class InboxProcessingError extends Error {
    constructor(message, { permanent = false } = {}) {
        super(message);

        this.name = "InboxProcessingError";
        this.permanent = permanent;
    }
}


class InboxClaimLostError extends Error {
    constructor() {
        super("The Inbox processing claim is no longer owned");
        this.name = "InboxClaimLostError";
    }
}


function getSafeErrorCode(error) {
    if (
        typeof error?.code === "string" &&
        /^[A-Z0-9_-]{1,120}$/i.test(error.code)
    ) {
        return error.code;
    }

    if (
        typeof error?.name === "string" &&
        /^[A-Z0-9_-]{1,120}$/i.test(error.name)
    ) {
        return error.name;
    }

    return "INBOX_PROCESSING_FAILED";
}


function createInboxProcessor({
    InboxModel = OutboxInbox,
    OutBoxModel = OutBox,

    handlers = {},

    transactionRunner = withTransaction,

    instanceId = `inbox-processor-${process.pid}`,

    leaseMs = 30_000,
    maxAttempts = 8,

    baseRetryDelayMs = 1000,
    maxRetryDelayMs = 60_000,

    now = () => new Date(),
    random = Math.random,

    logger = console,
}) {
    if (
        !InboxModel ||
        typeof InboxModel.findOneAndUpdate !== "function" ||
        typeof InboxModel.updateOne !== "function" ||
        typeof InboxModel.updateMany !== "function"
    ) {
        throw new TypeError(
            "InboxModel must provide the required Mongoose methods"
        );
    }

    if (
        !OutBoxModel ||
        typeof OutBoxModel.findById !== "function"
    ) {
        throw new TypeError(
            "OutBoxModel.findById is required"
        );
    }

    if (typeof transactionRunner !== "function") {
        throw new TypeError(
            "transactionRunner must be a function"
        );
    }

    if (
        !Number.isFinite(leaseMs) ||
        leaseMs <= 0 ||
        !Number.isInteger(maxAttempts) ||
        maxAttempts < 1
    ) {
        throw new TypeError(
            "Invalid lease or maximum attempts"
        );
    }


    async function recoverExhaustedClaims() {
        const currentTime = now();

        const staleBefore = new Date(
            currentTime.getTime() - leaseMs
        );

        const result = await InboxModel.updateMany(
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
                        "PROCESSING_LEASE_EXPIRED",
                },
            }
        );

        return result.modifiedCount ?? 0;
    }


    async function claimNextReceipt() {
        const currentTime = now();

        const staleBefore = new Date(
            currentTime.getTime() - leaseMs
        );

        await recoverExhaustedClaims();

        const claimToken =
            `${instanceId}-${crypto.randomUUID()}`;

        const receipt = await InboxModel.findOneAndUpdate(
            {
                $or: [
                    {
                        status: "PENDING",

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

        if (!receipt) {
            return null;
        }

        return {
            receipt,
            claimToken,
        };
    }


    async function recordFailure(
        receipt,
        claimToken,
        error
    ) {
        const permanent =
            error?.permanent === true;

        const exhausted =
            receipt.attempts >= maxAttempts;

        const terminal = permanent || exhausted;

        const retryDelayMs = terminal
            ? 0
            : calculateRetryDelayMs(
                receipt.attempts,
                {
                    baseDelayMs: baseRetryDelayMs,
                    maxDelayMs: maxRetryDelayMs,
                    random,
                }
            );

        const retryAt = new Date(
            now().getTime() + retryDelayMs
        );

        const result = await InboxModel.updateOne(
            {
                _id: receipt._id,

                status: "PROCESSING",

                lockedBy: claimToken,
            },
            {
                $set: {
                    status: terminal
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
            return {
                state: "claim-lost",
            };
        }

        logger.error(
            "[InboxProcessor] Processing failed",
            {
                inboxId: String(receipt._id),
                eventType: receipt.eventType,
                errorCode: getSafeErrorCode(error),
                terminal,
            }
        );

        return {
            state: terminal
                ? "failed"
                : "retry-scheduled",

            retryDelayMs,
        };
    }


    async function processOne() {
        const claim = await claimNextReceipt();

        if (!claim) {
            return {
                state: "idle",
            };
        }

        const {
            receipt,
            claimToken,
        } = claim;

        try {
            // MongoDB holds the authoritative event.
            const event = await OutBoxModel
                .findById(receipt.outboxId)
                .lean();

            if (!event) {
                throw new InboxProcessingError(
                    "Referenced Outbox event does not exist",
                    {
                        permanent: true,
                    }
                );
            }

            const handler = handlers[event.eventType];

            if (typeof handler !== "function") {
                throw new InboxProcessingError(
                    `No handler registered for ${event.eventType}`,
                    {
                        permanent: true,
                    }
                );
            }


            // The handler and completion record must use the
            // same MongoDB transaction.
            await transactionRunner(async (session) => {
                await handler({
                    event,
                    receipt,
                    session,
                });

                const result = await InboxModel.updateOne(
                    {
                        _id: receipt._id,

                        status: "PROCESSING",

                        lockedBy: claimToken,
                    },
                    {
                        $set: {
                            status: "COMPLETED",

                            processedAt: now(),

                            lockedAt: null,
                            lockedBy: null,

                            lastError: null,
                        },
                    },
                    {
                        session,
                    }
                );

                if (!result.matchedCount) {
                    throw new InboxClaimLostError();
                }
            });


            return {
                state: "completed",

                inboxId: String(receipt._id),

                outboxId: String(receipt.outboxId),

                eventType: event.eventType,
            };

        } catch (error) {
            if (error instanceof InboxClaimLostError) {
                logger.warn(
                    "[InboxProcessor] Lost processing claim",
                    {
                        inboxId: String(receipt._id),
                    }
                );

                return {
                    state: "claim-lost",
                };
            }

            const failure = await recordFailure(
                receipt,
                claimToken,
                error
            );

            return {
                ...failure,

                inboxId: String(receipt._id),
            };
        }
    }


    return {
        claimNextReceipt,
        recoverExhaustedClaims,
        processOne,
    };
}


module.exports = {
    InboxProcessingError,
    InboxClaimLostError,
    createInboxProcessor,
};