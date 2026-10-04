const mongoose = require("mongoose");

const OutBoxSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            trim: true
        },

        aggregateType: {
            type: String,
            required: true,
            trim: true
        },

        aggregateId: {
            type: String,
            required: true,
            trim: true
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PROCESSING",
                "COMPLETED",
                "FAILED"
            ],
            default: "PENDING",
            required: true
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0
        },

        availableAt: {
            type: Date,
            default: Date.now
        },

        lockedAt: {
            type: Date,
            default: null
        },

        lockedBy: {
            type: String,
            default: null
        },

        processedAt: {
            type: Date,
            default: null
        },

        lastError: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);


/*
 * Later the relay worker will search:
 *
 * PENDING events that are available.
 */
OutBoxSchema.index({
    status: 1,
    availableAt: 1,
    createdAt: 1
});


/*
 * Useful for finding events belonging
 * to a particular business entity.
 */
OutBoxSchema.index({
    aggregateType: 1,
    aggregateId: 1
});


const OutBox = mongoose.model(
    "OutBox",
    OutBoxSchema
);

module.exports = OutBox;