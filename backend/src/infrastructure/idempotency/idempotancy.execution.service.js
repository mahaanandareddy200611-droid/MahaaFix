const crypto = require("crypto");

const Idempotancy =
    require("./idempotancy.model");

const AppError =
    require("../../utils/AppError");

const withTransaction =
    require("../transactions/transaction");


class IdempotencyRace extends Error { 
    /*
    "Create a special error type that tells my backend: another concurrent request won the race to create this idempotency record."
    */

    constructor() {
        super("IDEMPOTENCY_RACE");
        this.name = "IdempotencyRace";
    }

}


const buildExecutionToken = () => {
    return crypto.randomUUID();
};


const getExistingRequest = async ({
    idempotancyKey,
    userId,
    endPoint
}) => {

    return Idempotancy.findOne({
        idempotancyKey,
        userId,
        endPoint
    });

};


const replayExisting = (record) => {

    if (!record.responseStatus) {
        throw new AppError(
            "Idempotency record has no saved response",
            500
        );
    }

    return {
        replayed: true,
        statusCode: record.responseStatus,
        body: record.responseBody
    };

};


const executeIdempotent = async ({
    idempotancy,
    operation
}) => {

    const {
        idempotancyKey,
        userId,
        endPoint,
        requestHash
    } = idempotancy;


    /*
     * --------------------------------------------------------
     * Step 1
     *
     * Check whether this logical request already exists.
     * --------------------------------------------------------
     */

    const existing =
        await getExistingRequest({
            idempotancyKey,
            userId,
            endPoint
        });


    if (existing) {

        /*
         * Same key + different payload
         */

        if (
            existing.requestHash !==
            requestHash
        ) {

            throw new AppError(
                "Idempotency-Key has already been used with a different request",
                409
            );

        }


        /*
         * Already completed.
         */

        if (
            existing.status ===
            "COMPLETED"
        ) {

            return replayExisting(
                existing
            );

        }


        /*
         * Failed request from an older
         * idempotency implementation.
         */

        if (
            existing.status ===
            "FAILED"
        ) {

            return replayExisting(
                existing
            );

        }


        /*
         * IN_PROGRESS
         *
         * With the new transaction design,
         * new records should only exist
         * inside a running transaction.
         *
         * Existing IN_PROGRESS records may
         * be from your old implementation.
         */

        if (
            existing.status ===
            "IN_PROGRESS"
        ) {

            throw new AppError(
                "A request with this Idempotency-Key is already being processed",
                409
            );

        }

    }


    /*
     * --------------------------------------------------------
     * Step 2
     *
     * Start the SAME Mongo transaction that
     * performs the business operation.
     * --------------------------------------------------------
     */

    try {

        return await withTransaction(
            async (session) => {

                let record;

                /*
                 * Create idempotency record
                 * INSIDE the transaction.
                 */

                try {

                    [record] =
                        await Idempotancy.create(
                            [
                                {
                                    idempotancyKey,

                                    userId,

                                    endPoint,

                                    requestHash,

                                    status:
                                        "IN_PROGRESS",

                                    processingStartedAt:
                                        new Date(),

                                    expiresAt:
                                        new Date(
                                            Date.now() +
                                            48 *
                                            60 *
                                            60 *
                                            1000
                                        ),

                                    executionToken:
                                        buildExecutionToken()
                                }
                            ],
                            {
                                session
                            }
                        );

                } catch (error) {

                    /*
                     * Another concurrent request
                     * created the same idempotency
                     * record first.
                     */

                    if (
                        error.code === 11000
                    ) {

                        throw new IdempotencyRace();

                    }

                    throw error;
                }


                /*
                 * ------------------------------------------------
                 * Business operation
                 *
                 * IMPORTANT:
                 * operation MUST use this SAME session.
                 * ------------------------------------------------
                 */

                const result =
                    await operation(
                        session
                    );


                if (
                    !result ||
                    !result.statusCode ||
                    !result.body
                ) {

                    throw new AppError(
                        "Idempotent operation must return statusCode and body",
                        500
                    );

                }


                /*
                 * ------------------------------------------------
                 * Complete idempotency INSIDE transaction.
                 * ------------------------------------------------
                 */

                const completed =
                    await Idempotancy.findOneAndUpdate(
                        {
                            _id: record._id,

                            executionToken:
                                record.executionToken,

                            status:
                                "IN_PROGRESS"
                        },
                        {
                            $set: {

                                status:
                                    "COMPLETED",

                                responseStatus:
                                    result.statusCode,

                                responseBody:
                                    result.body,

                                completedAt:
                                    new Date()
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );


                if (!completed) {

                    throw new AppError(
                        "Failed to complete idempotency record",
                        500
                    );

                }


                return {
                    replayed: false,

                    statusCode:
                        result.statusCode,

                    body:
                        result.body
                };

            }
        );

    } catch (error) {

        /*
         * ----------------------------------------------------
         * Concurrent-request race.
         *
         * The losing transaction aborted because the
         * unique idempotency index already existed.
         *
         * Now read the committed winner.
         * ----------------------------------------------------
         */

        if (
            error instanceof
            IdempotencyRace
        ) {

            const winner =
                await getExistingRequest({
                    idempotancyKey,
                    userId,
                    endPoint
                });


            if (!winner) {

                throw new AppError(
                    "Unable to resolve idempotency race",
                    409
                );

            }


            if (
                winner.requestHash !==
                requestHash
            ) {

                throw new AppError(
                    "Idempotency-Key has already been used with a different request",
                    409
                );

            }


            if (
                winner.status ===
                "COMPLETED"
            ) {

                return replayExisting(
                    winner
                );

            }


            throw new AppError(
                "A request with this Idempotency-Key is already being processed",
                409
            );

        }

        throw error;

    }

};


module.exports = executeIdempotent;