const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createOutboxConsumer,
} = require(
    "../src/infrastructure/outbox/outbox-consumer.service"
);


const outboxId = "6ac8be3183072aa6eccb1948";

const event = {
    _id: outboxId,

    eventType: "JOB_CREATED",

    aggregateType: "Job",

    aggregateId: "job-123",

    payload: {
        title: "Electrical repair",
    },
};


function createFakeModels() {
    const events = new Map([
        [outboxId, event],
    ]);

    const receipts = new Map();

    let nextReceiptId = 0;

    const OutBoxModel = {
        findById(id) {
            return {
                lean: async () =>
                    events.get(String(id)) ?? null,
            };
        },
    };

    const InboxModel = {
        findOne(filter) {
            return {
                lean: async () =>
                    receipts.get(
                        String(filter.outboxId)
                    ) ?? null,
            };
        },

        async create(documents) {
            const document = documents[0];

            const key = String(
                document.outboxId
            );

            if (receipts.has(key)) {
                const error = new Error(
                    "Duplicate Inbox receipt"
                );

                error.code = 11000;

                throw error;
            }

            const created = {
                ...document,

                _id: `inbox-${++nextReceiptId}`,
            };

            receipts.set(key, created);

            return [created];
        },
    };

    return {
        OutBoxModel,
        InboxModel,
        events,
        receipts,
    };
}


test(
    "records a durable Inbox receipt for a valid event",
    async () => {
        const fake = createFakeModels();

        const consumer = createOutboxConsumer({
            OutBoxModel: fake.OutBoxModel,
            InboxModel: fake.InboxModel,

            now: () =>
                new Date("2026-10-17T10:00:00.000Z"),
        });

        const result =
            await consumer.receiveOutboxEvent({
                outboxId,
            });

        assert.equal(
            result.state,
            "received"
        );

        assert.equal(
            fake.receipts.size,
            1
        );

        const receipt = fake.receipts.get(
            outboxId
        );

        assert.equal(
            receipt.eventType,
            "JOB_CREATED"
        );

        assert.equal(
            receipt.status,
            "PENDING"
        );

        // The receipt stores a reference to the source event,
        // rather than copying potentially sensitive payloads.
        assert.equal(
            Object.hasOwn(receipt, "payload"),
            false
        );
    }
);


test(
    "repeated delivery does not create another receipt",
    async () => {
        const fake = createFakeModels();

        const consumer = createOutboxConsumer({
            OutBoxModel: fake.OutBoxModel,
            InboxModel: fake.InboxModel,
        });

        const first =
            await consumer.receiveOutboxEvent({
                outboxId,
            });

        const second =
            await consumer.receiveOutboxEvent({
                outboxId,
            });

        assert.equal(
            first.state,
            "received"
        );

        assert.equal(
            second.state,
            "duplicate"
        );

        assert.equal(
            fake.receipts.size,
            1
        );
    }
);


test(
    "rejects a malformed Outbox ID",
    async () => {
        const fake = createFakeModels();

        const consumer = createOutboxConsumer({
            OutBoxModel: fake.OutBoxModel,
            InboxModel: fake.InboxModel,
        });

        await assert.rejects(
            consumer.receiveOutboxEvent({
                outboxId: "not-an-object-id",
            }),
            {
                name: "InvalidOutboxMessageError",
                permanent: true,
            }
        );

        assert.equal(
            fake.receipts.size,
            0
        );
    }
);


test(
    "rejects an Outbox ID that does not exist",
    async () => {
        const fake = createFakeModels();

        const consumer = createOutboxConsumer({
            OutBoxModel: fake.OutBoxModel,
            InboxModel: fake.InboxModel,
        });

        await assert.rejects(
            consumer.receiveOutboxEvent({
                outboxId:
                    "000000000000000000000000",
            }),
            {
                name: "InvalidOutboxMessageError",
                permanent: true,
            }
        );

        assert.equal(
            fake.receipts.size,
            0
        );
    }
);


test(
    "rejects unregistered event types",
    async () => {
        const fake = createFakeModels();

        fake.events.set(
            outboxId,
            {
                ...event,
                eventType: "UNKNOWN_EVENT",
            }
        );

        const consumer = createOutboxConsumer({
            OutBoxModel: fake.OutBoxModel,
            InboxModel: fake.InboxModel,
        });

        await assert.rejects(
            consumer.receiveOutboxEvent({
                outboxId,
            }),
            {
                name:
                    "UnsupportedOutboxEventTypeError",
                permanent: true,
            }
        );

        assert.equal(
            fake.receipts.size,
            0
        );
    }
);