require("dotenv").config();

const {
    Worker,
    UnrecoverableError,
} = require("bullmq");

const connectDB = require("../config/db");

const {
    getRedisConnectionOptions,
} = require("../infrastructure/redis/redis.connection");

const {
    EVENT_QUEUE_NAME,
} = require("../infrastructure/queue/queue.constants");

const {
    createOutboxConsumer,
} = require(
    "../infrastructure/outbox/outbox-consumer.service"
);

const {
    InvalidOutboxMessageError,
} = require(
    "../infrastructure/outbox/outbox-consumer.service"
);


async function startWorker() {
    await connectDB();

    const outboxConsumer =
        createOutboxConsumer();

    const worker = new Worker(
        EVENT_QUEUE_NAME,

        async function processEvent(job) {
            switch (job.name) {
                case "QUEUE_SMOKE_TEST": {
                    console.log(
                        "[Worker] Smoke-test job received",
                        {
                            jobId: job.id,
                        }
                    );

                    return {
                        success: true,
                        processedAt:
                            new Date().toISOString(),
                    };
                }

                case "OUTBOX_EVENT": {
                    try {
                        return await
                            outboxConsumer.receiveOutboxEvent(
                                job.data
                            );
                    } catch (error) {
                        if (
                            error.permanent ||
                            error instanceof
                                InvalidOutboxMessageError
                        ) {
                            throw new UnrecoverableError(
                                error.message
                            );
                        }

                        // Database or infrastructure failures
                        // remain eligible for BullMQ retries.
                        throw error;
                    }
                }

                default:
                    throw new UnrecoverableError(
                        `Unsupported queue job: ${job.name}`
                    );
            }
        },

        {
            connection:
                getRedisConnectionOptions({
                    worker: true,
                }),

            concurrency: 5,
        }
    );

    worker.on("ready", () => {
        console.log(
            `[Worker] Listening on queue: ${EVENT_QUEUE_NAME}`
        );
    });

    worker.on("completed", (job, result) => {
        console.log(
            `[Worker] Job ${job.id} completed`,
            result
        );
    });

    worker.on("failed", (job, error) => {
        console.error(
            `[Worker] Job ${job?.id} failed:`,
            error.message
        );
    });

    worker.on("error", (error) => {
        console.error(
            "[Worker] Runtime error:",
            error.message
        );
    });

    await worker.waitUntilReady();

    console.log(
        "[Worker] Redis connection is ready"
    );

    return worker;
}


let activeWorker = null;
let shuttingDown = false;


async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(
        `[Worker] Received ${signal}; shutting down`
    );

    try {
        if (activeWorker) {
            await activeWorker.close();
        }

        const mongoose = require("mongoose");

        await mongoose.disconnect();

        console.log(
            "[Worker] Shutdown complete"
        );
    } catch (error) {
        console.error(
            "[Worker] Shutdown failed:",
            error.message
        );

        process.exitCode = 1;
    }
}


process.once("SIGINT", () => {
    void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
});


startWorker()
    .then((worker) => {
        activeWorker = worker;

        if (shuttingDown) {
            void shutdown("SHUTDOWN_REQUESTED");
        }
    })
    .catch((error) => {
        console.error(
            "[Worker] Startup failed:",
            error.message
        );

        process.exitCode = 1;
    });