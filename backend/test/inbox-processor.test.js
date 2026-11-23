
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createInboxProcessor,
} = require(
    "../src/infrastructure/outbox/inbox-processor.service"
);

const inboxId = "inbox-001";
const outboxId = "6ac8be3183072aa6eccb1948";

const fixedTime = new Date(
    "2026-10-17T12:00:00.000Z"
);

function createFakeDependencies({
    handler,
    transactionFailure,
    handlers: customHandlers,
} = {}) {
    const receipt = {
        _id: inboxId,
        outboxId,
        eventType: "JOB_CREATED",
        aggregateType: "Job",
        aggregateId: "job-123",
        status: "PENDING",
        attempts: 0,
        availableAt: fixedTime,
        lockedAt: null,
        lockedBy: null,
        createdAt: fixedTime,
    };

    const event = {
        _id: outboxId,
        eventType: "JOB_CREATED",
        aggregateType: "Job",
        aggregateId: "job-123",
        payload: {
            title: "Test job",
        },
    };

    const calls = {
        claims: [],
        inboxUpdates: [],
        completionSession: null,
        handlerSession: null,
        handlerCalls: 0,
    };

    const InboxModel = {
        async updateMany() {
            return {
                modifiedCount: 0,
            };
        },

        async findOneAndUpdate(
            filter,
            update,
            options
        ) {
            calls.claims.push({
                filter,
                update,
                options,
            });

            if (
                receipt.status === "COMPLETED" ||
                receipt.status === "FAILED"
            ) {
                return null;
            }

            Object.assign(
                receipt,
                update.$set
            );

            receipt.attempts +=
                update.$inc.attempts;

            return {
                ...receipt,
            };
        },

        async updateOne(
            filter,
            update,
            options
        ) {
            calls.inboxUpdates.push({
                filter,
                update,
                options,
            });

            if (
                receipt._id !== filter._id ||
                receipt.lockedBy !== filter.lockedBy ||
                receipt.status !== filter.status
            ) {
                return {
                    matchedCount: 0,
                };
            }

            Object.assign(
                receipt,
                update.$set
            );

            calls.completionSession =
                options?.session ?? null;

            return {
                matchedCount: 1,
                modifiedCount: 1,
            };
        },
    };

    const OutBoxModel = {
        findById(id) {
            return {
                lean: async () =>
                    String(id) === outboxId
                        ? event
                        : null,
            };
        },
    };

    const handlers = customHandlers ?? {
        JOB_CREATED: async ({ event, session }) => {
            calls.handlerCalls += 1;

            calls.handlerSession = session;

            assert.equal(
                event.eventType,
                "JOB_CREATED"
            );

            if (handler) {
                await handler({
                    event,
                    session,
                });
            }
        },
    };

    const transactionRunner = async (operation) => {
        if (transactionFailure) {
            throw transactionFailure;
        }

        const fakeSession = {
            id: "transaction-session",
        };

        return operation(fakeSession);
    };

    const processor = createInboxProcessor({
        InboxModel,
        OutBoxModel,
        handlers,
        transactionRunner,

        instanceId: "test-processor",

        maxAttempts: 3,

        now: () => new Date(fixedTime),

        logger: {
            error() {},
            warn() {},
        },
    });

    return {
        processor,
        receipt,
        calls,
    };
}

test(
    "successful processing marks the receipt COMPLETED",
    async () => {
        const fake = createFakeDependencies();

        const result =
            await fake.processor.processOne();

        assert.equal(
            result.state,
            "completed"
        );

        assert.equal(
            fake.receipt.status,
            "COMPLETED"
        );

        assert.equal(
            fake.calls.handlerCalls,
            1
        );

        assert.equal(
            fake.calls.handlerSession.id,
            "transaction-session"
        );

        assert.equal(
            fake.calls.completionSession.id,
            "transaction-session"
        );

        assert.equal(
            fake.receipt.processedAt.getTime(),
            fixedTime.getTime()
        );
    }
);

test(
    "missing handlers fail permanently",
    async () => {
        const fake = createFakeDependencies({
            handlers: {},
        });

        const result =
            await fake.processor.processOne();

        assert.equal(
            result.state,
            "failed"
        );

        assert.equal(
            fake.receipt.status,
            "FAILED"
        );

        assert.equal(
            fake.receipt.lastError,
            "InboxProcessingError"
        );
    }
);

test(
    "transaction failure schedules a retry when retry state can be saved",
    async () => {
        const fake = createFakeDependencies({
            transactionFailure: new Error(
                "Temporary transaction failure"
            ),
        });

        const result =
            await fake.processor.processOne();

        assert.equal(
            result.state,
            "retry-scheduled"
        );

        assert.equal(
            fake.receipt.status,
            "PENDING"
        );

        assert.equal(
            fake.receipt.lockedAt,
            null
        );

        assert.equal(
            fake.receipt.lockedBy,
            null
        );

        assert.ok(
            fake.receipt.availableAt.getTime()
                > fixedTime.getTime()
        );
    }
);

test(
    "handler failures do not mark the receipt completed",
    async () => {
        const fake = createFakeDependencies({
            handler: async () => {
                throw new Error(
                    "Temporary handler failure"
                );
            },
        });

        const result =
            await fake.processor.processOne();

        assert.equal(
            result.state,
            "retry-scheduled"
        );

        assert.equal(
            fake.receipt.status,
            "PENDING"
        );
    }
);
