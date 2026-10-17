require("dotenv").config();

const { Worker } = require("bullmq");

const {
    getRedisConnectionOptions
} = require("../infrastructure/redis/redis.connection");

const {
    EVENT_QUEUE_NAME
} = require("../infrastructure/queue/queue.constants");


async function processEvent(job) {
    console.log(
        `[Worker] Received job: ${job.name}, ID: ${job.id}`
    );

    switch (job.name) {
        case "QUEUE_SMOKE_TEST": {
            console.log(
                "[Worker] Test payload:",
                job.data
            );

            return {
                success: true,
                processedAt: new Date().toISOString()
            };
        }

        default:
            throw new Error(
                `No handler registered for job type: ${job.name}`
            );
    }
}


const worker = new Worker(
    EVENT_QUEUE_NAME,
    processEvent,
    {
        connection: getRedisConnectionOptions({
            worker: true
        }),

        // Initially, process no more than five jobs concurrently.
        concurrency: 5
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


async function shutdown(signal) {
    console.log(`[Worker] Received ${signal}; shutting down`);

    try {
        await worker.close();
        console.log("[Worker] Shutdown complete");
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


worker.waitUntilReady()
    .then(() => {
        console.log("[Worker] Redis connection is ready");
    })
    .catch((error) => {
        console.error(
            "[Worker] Could not initialize:",
            error.message
        );

        process.exitCode = 1;
    });