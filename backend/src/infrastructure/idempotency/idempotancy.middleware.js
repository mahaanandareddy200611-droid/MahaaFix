const AppError = require("../../utils/AppError");

const idempotancyService = require("./idempotancy.service");

const {
  validateIdempotancyKey,
} = require("./idempotancy.validator");

const {
  createRequestHash,
} = require("./idempotancy.hash");

const idempotancyMiddleware = async (req, res, next) => {
  try {
    /*
     * Header names are case-insensitive.
     */
    const key = req.get("Idempotency-Key");

    const validation = validateIdempotancyKey(key);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Valid Idempotency-Key header is required",
      });
    }

    /*
     * Authentication must happen before this middleware.
     */
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for idempotency",
      });
    }

    const endPoint = `${req.method}:${req.baseUrl}${req.path}`;

    /*
     * Fingerprint the complete logical request.
     */
    const requestHash = createRequestHash(
      req,
      endPoint
    );

    const result =
      await idempotancyService.checkAndCreate({
        idempotancyKey: validation.value,
        userId: req.user.id,
        endPoint,
        requestHash,
      });

    /*
     * Same key + different request.
     *
     * checkAndCreate already throws 409.
     */

    /*
     * Existing completed/failed request.
     * Replay the saved response.
     */
    if (result.action === "REPLAY") {
      const record = result.record;

      res.set(
        "Idempotency-Replayed",
        "true"
      );

      return res
        .status(record.responseStatus)
        .json(record.responseBody);
    }

    /*
     * Another request with the same key is currently running.
     */
    if (result.action === "IN_PROGRESS") {
      res.set(
        "Retry-After",
        "2"
      );

      return res.status(409).json({
        success: false,
        message:
          "A request with this Idempotency-Key is already being processed",
      });
    }

    /*
     * This request owns the execution.
     */
    const record = result.record;

    /*
     * Store information for response completion.
     */
    req.idempotancy = {
      recordId: record._id,
      executionToken: record.executionToken,
      idempotancyKey: record.idempotancyKey,
    };

    /*
     * Capture response body.
     */
    let responseBody;

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body) {
      responseBody = body;
      return originalJson(body);
    };

    res.send = function (body) {
      responseBody = body;
      return originalSend(body);
    };

    /*
     * Express emits finish after response has been sent.
     *
     * Here we store the actual result.
     */
    res.once("finish", async () => {
      try {
        const responseStatus = res.statusCode;

        /*
         * 2xx / 3xx = completed operation
         * 4xx / 5xx = failed operation
         */
        if (responseStatus >= 400) {
          await idempotancyService.fail({
            recordId: record._id,
            executionToken: record.executionToken,
            responseStatus,
            responseBody,
          });
        } else {
          await idempotancyService.complete({
            recordId: record._id,
            executionToken: record.executionToken,
            responseStatus,
            responseBody,
          });
        }
      } catch (error) {
        /*
         * Never crash the request because idempotency persistence failed.
         */
        console.error(
          "Failed to persist idempotency response:",
          error
        );
      }
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = idempotancyMiddleware;