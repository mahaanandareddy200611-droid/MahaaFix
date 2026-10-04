const {
    validateIdempotancyKey
} = require("./idempotancy.validator");

const {
    createRequestHash
} = require("./idempotancy.hash");

const idempotancyMiddleware = (req, res, next) => {

    try {

        const key = req.get("Idempotency-Key");

        const validation =
            validateIdempotancyKey(key);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: "Valid Idempotency-Key header is required"
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required for idempotency"
            });
        }

        const endPoint =
            `${req.method}:${req.baseUrl}${req.path}`;

        const requestHash =
            createRequestHash(
                req,
                endPoint
            );

        req.idempotancy = {

            idempotancyKey:
                validation.value,

            userId:
                req.user.id,

            endPoint,

            requestHash
        };

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = idempotancyMiddleware;