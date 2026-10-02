const crypto = require("crypto");

const Idempotancy = require("./idempotancy.model");
const AppError = require("../../utils/AppError");

const IDEMPOTENCY_TTL_MS = 48 * 60 * 60 * 1000;  // alive for 48 hours

// How long an IN_PROGRESS request is considered alive.
const PROCESSING_TIMEOUT_MS = 2 * 60 * 1000;

const buildExpiration = () => { // this is TTL of 48 hrs
  return new Date(Date.now() + IDEMPOTENCY_TTL_MS);
};

const buildExecutionToken = () => {
  return crypto.randomUUID();
};

/*
 * Create the idempotency record.
 *
 * We intentionally do NOT do:
 *
 * findOne()
 *    ↓
 * create()
 *
 * because two simultaneous requests can both pass findOne().
 *
 * Instead we try create() directly and let MongoDB's unique
 * index solve the race.
 */

exports.checkAndCreate = async ({
  idempotancyKey,
  userId,
  endPoint,
  requestHash,
}) => {
  const now = new Date();

  try {
    const record = await Idempotancy.create({
      idempotancyKey,
      userId,
      endPoint,
      requestHash,

      status: "IN_PROGRESS",

      processingStartedAt: now,

      expiresAt: buildExpiration(),

      executionToken: buildExecutionToken(),
    });

    return {
      action: "NEW",
      record,
    };
  } catch (error) {
    /*
     * Duplicate compound index:
     *
     * another request already owns this key.
     */
    if (error.code !== 11000) {
        console.log(error)
      throw error;
    }

    const existing = await Idempotancy.findOne({
      idempotancyKey,
      userId,
      endPoint,
    });

    /*
     * Extremely unusual race where the record disappeared between
     * duplicate-key detection and findOne().
     */
    if (!existing) {
      throw new AppError(
        "Unable to resolve idempotency request",
        409
      );
    }

    /*
     * Same idempotency key but different request.
     */
    if (existing.requestHash !== requestHash) {
      throw new AppError(
        "Idempotency-Key has already been used with a different request",
        409
      );
    }

    /*
     * The original request already completed.
     *
     * Replay the exact stored response.
     */
    if (existing.status === "COMPLETED") {
      return {
        action: "REPLAY",
        record: existing,
      };
    }

    /*
     * Previous request failed with a stored response.
     *
     * Replay the same result.
     */
    if (existing.status === "FAILED") {
      return {
        action: "REPLAY",
        record: existing,
      };
    }

    /*
     * IN_PROGRESS
     */

    const processingStartedAt =
      existing.processingStartedAt || existing.createdAt;

    const staleCutoff = new Date(
      Date.now() - PROCESSING_TIMEOUT_MS
    );

    /*
     * The request may have died:
     *
     * server crash
     * process kill
     * machine restart
     * network interruption before completion
     *
     * Try to reclaim it atomically.
     */
    if (processingStartedAt < staleCutoff) {
      const newExecutionToken = buildExecutionToken();

      const reclaimed = await Idempotancy.findOneAndUpdate(
        {
          _id: existing._id,
          status: "IN_PROGRESS",

          requestHash,

          $or: [
            {
              processingStartedAt: {
                $lt: staleCutoff,
              },
            },
            {
              processingStartedAt: {
                $exists: false,
              },
              createdAt: {
                $lt: staleCutoff,
              },
            },
          ],
        },
        {
          $set: {
            processingStartedAt: new Date(),
            executionToken: newExecutionToken,
            expiresAt: buildExpiration(),
          },
        },
        {
          new: true,
        }
      );

      /*
       * We successfully became the new execution owner.
       */
      if (reclaimed) {
        return {
          action: "NEW",
          reclaimed: true,
          record: reclaimed,
        };
      }

      /*
       * Another concurrent retry reclaimed it first.
       */
      return {
        action: "IN_PROGRESS",
        record: existing,
      };
    }

    /*
     * Original request is still alive.
     */
    return {
      action: "IN_PROGRESS",
      record: existing,
    };
  }
};

/*
 * Mark successful/normal response.
 *
 * executionToken is checked so that an old request cannot overwrite
 * a record after stale recovery.
 */
exports.complete = async ({
  recordId,
  executionToken,
  responseStatus,
  responseBody,
}) => {
  const result = await Idempotancy.findOneAndUpdate(
    {
      _id: recordId,
      executionToken,
      status: "IN_PROGRESS",
    },
    {
      $set: {
        status: "COMPLETED",
        responseStatus,
        responseBody,
        completedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  return result;
};

/*
 * Store a failed HTTP response.
 */
exports.fail = async ({
  recordId,
  executionToken,
  responseStatus,
  responseBody,
}) => {
  const result = await Idempotancy.findOneAndUpdate(
    {
      _id: recordId,
      executionToken,
      status: "IN_PROGRESS",
    },
    {
      $set: {
        status: "FAILED",
        responseStatus,
        responseBody,
        failedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  return result;
};