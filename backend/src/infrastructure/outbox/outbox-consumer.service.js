const OutBox = require("../../models/OutBox");

const OutboxInbox = require(
    "../../models/OutboxInbox"
);

const {
    assertSupportedOutboxEventType,
} = require("./outbox-event.types");


class InvalidOutboxMessageError extends Error {
    constructor(message) {
        super(message);

        this.name = "InvalidOutboxMessageError";
        this.permanent = true;
    }
}


function createOutboxConsumer({
    OutBoxModel = OutBox,
    InboxModel = OutboxInbox,
    now = () => new Date(),
}) {
    async function receiveOutboxEvent(data) {
        const outboxId = data?.outboxId;

        // OutBox IDs are MongoDB ObjectIds.
        if (
            typeof outboxId !== "string" ||
            !/^[a-f0-9]{24}$/i.test(outboxId)
        ) {
            throw new InvalidOutboxMessageError(
                "A valid outboxId is required"
            );
        }

        // Load the authoritative event from MongoDB.
        const event = await OutBoxModel
            .findById(outboxId)
            .lean();

        if (!event) {
            throw new InvalidOutboxMessageError(
                "The referenced Outbox event does not exist"
            );
        }

        // Never trust event types supplied only by Redis.
        assertSupportedOutboxEventType(
            event.eventType
        );

        const receiptKey = {
            outboxId: event._id,
        };

        // Fast path for previously received events.
        const existingReceipt = await InboxModel
            .findOne(receiptKey)
            .lean();

        if (existingReceipt) {
            return {
                state: "duplicate",
                outboxId,
            };
        }

        const receipt = {
            ...receiptKey,

            eventType: event.eventType,

            aggregateType: event.aggregateType,

            aggregateId: String(
                event.aggregateId
            ),

            status: "PENDING",

            availableAt: now(),
        };

        try {
            // The unique MongoDB index is the final protection
            // against simultaneous duplicate deliveries.
            const [createdReceipt] =
                await InboxModel.create([receipt]);

            return {
                state: "received",

                outboxId,

                inboxId: String(
                    createdReceipt._id
                ),
            };
        } catch (error) {
            if (error?.code !== 11000) {
                throw error;
            }

            // Another delivery may have inserted the receipt
            // after our initial existence check.
            const duplicateReceipt = await InboxModel
                .findOne(receiptKey)
                .lean();

            if (!duplicateReceipt) {
                // Do not hide an unrelated or unresolved error.
                throw error;
            }

            return {
                state: "duplicate",
                outboxId,
            };
        }
    }

    return {
        receiveOutboxEvent,
    };
}


module.exports = {
    InvalidOutboxMessageError,
    createOutboxConsumer,
};