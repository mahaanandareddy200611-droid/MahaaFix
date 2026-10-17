const { Queue } = require("bullmq");

const {
    getRedisConnectionOptions
} = require("../redis/redis.connection");

const {
    EVENT_QUEUE_NAME
} = require("./queue.constants");


const eventQueue = new Queue(EVENT_QUEUE_NAME, {
    connection: getRedisConnectionOptions(),

    defaultJobOptions: {
        // Retry failed background jobs.
        attempts: 5,

        // Increase the delay between retries.
        backoff: {
            type: "exponential",
            delay: 1000
        },

        // Keep completed jobs temporarily for diagnostics.
        removeOnComplete: {
            age: 3600,
            count: 1000
        },

        // Retain failed jobs longer for investigation.
        removeOnFail: {
            age: 24 * 3600,
            count: 5000
        }
    }
});


eventQueue.on("error", (error) => {
    console.error("[MahaaFix Queue]", error.message);
});


module.exports = {
    eventQueue,
    EVENT_QUEUE_NAME
};