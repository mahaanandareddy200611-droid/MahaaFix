const mongoose = require("mongoose");

const { Schema } = mongoose;

const OutboxInboxSchema = new Schema(
    {
        outboxId: {
            type: Schema.Types.ObjectId,
            required: true,
            immutable: true,
        },

        eventType: {
            type: String,
            required: true,
            trim: true,
        },

        aggregateType: {
            type: String,
            required: true,
            trim: true,
        },

        aggregateId: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PROCESSING",
                "COMPLETED",
                "FAILED",
            ],
            default: "PENDING",
            required: true,
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0,
        },

        availableAt: {
            type: Date,
            default: Date.now,
        },

        lockedAt: {
            type: Date,
            default: null,
        },

        lockedBy: {
            type: String,
            default: null,
        },

        processedAt: {
            type: Date,
            default: null,
        },

        lastError: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One durable Inbox receipt per Outbox event.
OutboxInboxSchema.index(
    { outboxId: 1 },
    { unique: true }
);

// Supports the future Inbox processing worker.
OutboxInboxSchema.index({
    status: 1,
    availableAt: 1,
    createdAt: 1,
});

module.exports = mongoose.model(
    "OutboxInbox",
    OutboxInboxSchema
);