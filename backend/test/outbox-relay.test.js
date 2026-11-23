const test = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateRetryDelayMs,
    createOutboxRelay,
} = require(
    "../src/infrastructure/outbox/outbox-relay.service"
);


function createEvent(overrides = {}) {
    return {
        _id: "event-123",

        eventType: "JOB_CREATED",

        aggregateType: "Job",

        aggregateId: "job-123",

        attempts: 1,

        ...overrides,
    };
}


function createOutBoxFake(event) {
    const calls = {
        findOneAndUpdate: [],
        updateOne: [],
        updateMany: [],
    };

    const OutBox = {
        async findOneAndUpdate(...args) {
            calls.findOneAndUpdate.push(args);

            return event;
        },

        async updateOne(...args) {
            calls.updateOne.push(args);

            return {
                matchedCount: 1,
                modifiedCount: 1,
            };
        },

        async updateMany(...args) {
            calls.updateMany.push(args);

            return {
                matchedCount: 0,
                modifiedCount: 0,
            };
        },
    };

    return {
        OutBox,
        calls,
    };
}


const fixedTime =
    new Date("2026-10-17T10:00:00.000Z");


test(
    "relay publishes metadata and marks the event PUBLISHED",
    async () => {
        const event = createEvent();

        const {
            OutBox,
            calls,
        } = createOutBoxFake(event);

        let queueCall;

        const eventQueue = {
            async add(...args) {
                queueCall = args;
            },
        };

        const relay = createOutboxRelay({
            OutBox,
            eventQueue,

            instanceId: "test-relay",

            now: () => new Date(fixedTime),
        });

        const result = await relay.relayOne();

        assert.equal(
            result.state,
            "published"
        );

        assert.equal(
            queueCall[0],
            "OUTBOX_EVENT"
        );

        assert.deepEqual(
            queueCall[1],
            {
                outboxId: "event-123",

                eventType: "JOB_CREATED",

                aggregateType: "Job",

                aggregateId: "job-123",
            }
        );

        assert.equal(
            queueCall[2].jobId,
            "outbox-event-123"
        );

        assert.equal(
            "payload" in queueCall[1],
            false
        );

        const update =
            calls.updateOne[0][1].$set;

        assert.equal(
            update.status,
            "PUBLISHED"
        );

        assert.equal(
            update.publishedAt.getTime(),
            fixedTime.getTime()
        );
    }
);


test(
    "publication failure schedules a retry",
    async () => {
        const event = createEvent({
            attempts: 1,
        });

        const {
            OutBox,
            calls,
        } = createOutBoxFake(event);

        const eventQueue = {
            async add() {
                const error = new Error(
                    "Redis unavailable"
                );

                error.code = "ECONNREFUSED";

                throw error;
            },
        };

        const relay = createOutboxRelay({
            OutBox,
            eventQueue,

            instanceId: "test-relay",

            maxAttempts: 3,

            baseRetryDelayMs: 1000,

            random: () => 0,

            now: () => new Date(fixedTime),

            logger: {
                warn() {},
                error() {},
            },
        });

        const result = await relay.relayOne();

        assert.equal(
            result.state,
            "retry-scheduled"
        );

        assert.equal(
            result.retryDelayMs,
            500
        );

        const update =
            calls.updateOne[0][1].$set;

        assert.equal(
            update.status,
            "PENDING"
        );

        assert.equal(
            update.availableAt.getTime(),
            fixedTime.getTime() + 500
        );

        assert.equal(
            update.lastError,
            "ECONNREFUSED"
        );

        assert.equal(
            update.lockedAt,
            null
        );

        assert.equal(
            update.lockedBy,
            null
        );
    }
);


test(
    "publication failure exhausts the relay retry limit",
    async () => {
        const event = createEvent({
            attempts: 3,
        });

        const {
            OutBox,
            calls,
        } = createOutBoxFake(event);

        const eventQueue = {
            async add() {
                throw new Error(
                    "Queue submission failed"
                );
            },
        };

        const relay = createOutboxRelay({
            OutBox,
            eventQueue,

            instanceId: "test-relay",

            maxAttempts: 3,

            now: () => new Date(fixedTime),

            logger: {
                warn() {},
                error() {},
            },
        });

        const result = await relay.relayOne();

        assert.equal(
            result.state,
            "failed"
        );

        const update =
            calls.updateOne[0][1].$set;

        assert.equal(
            update.status,
            "FAILED"
        );

        assert.equal(
            update.lastError,
            "Error"
        );
    }
);


test(
    "retry delay increases exponentially and stays capped",
    () => {
        const firstAttempt = calculateRetryDelayMs(
            1,
            {
                baseDelayMs: 1000,
                maxDelayMs: 10_000,
                random: () => 1,
            }
        );

        const secondAttempt = calculateRetryDelayMs(
            2,
            {
                baseDelayMs: 1000,
                maxDelayMs: 10_000,
                random: () => 1,
            }
        );

        const lateAttempt = calculateRetryDelayMs(
            20,
            {
                baseDelayMs: 1000,
                maxDelayMs: 10_000,
                random: () => 1,
            }
        );

        assert.equal(firstAttempt, 1000);
        assert.equal(secondAttempt, 2000);
        assert.equal(lateAttempt, 10_000);
    }
);