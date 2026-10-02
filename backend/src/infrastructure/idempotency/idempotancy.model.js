const mongoose = require("mongoose");

const idempotancySchema = new mongoose.Schema(
  {
    idempotancyKey: {
      type: String,
      trim: true,
      maxlength: 255,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },

    endPoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    requestHash: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
      required: true,
      default: "IN_PROGRESS",
    },

    responseStatus: {
      type: Number,
    },

    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    processingStartedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Identifies the current execution owner.
    // Important for stale IN_PROGRESS recovery.
    executionToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * One logical request identity:
 *
 * user + endpoint + idempotency key
 */
idempotancySchema.index(
  {
    userId: 1,
    endPoint: 1,
    idempotancyKey: 1,
  },
  {
    unique: true,
  }
);

/*
 * Automatically remove records when expiresAt is reached.
 */
idempotancySchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

module.exports = mongoose.model(
  "Idempotancy",
  idempotancySchema
);