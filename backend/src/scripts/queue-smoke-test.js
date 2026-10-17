require("dotenv").config();

const {
    eventQueue,
    EVENT_QUEUE_NAME
} = require("../infrastructure/queue/mahaafix.queue");


async function main() {
    try {
        await eventQueue.waitUntilReady();

        const jobId = `smoke-${Date.now()}`;

        const job = await eventQueue.add(
            "QUEUE_SMOKE_TEST",
            {
                message: "MahaaFix BullMQ test",
                createdAt: new Date().toISOString()
            },
            {
                jobId,
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: false
            }
        );

        console.log("Queue test submitted successfully");
        console.log("Queue:", EVENT_QUEUE_NAME);
        console.log("Job ID:", job.id);

    } catch (error) {
        console.error(
            "Queue test failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await eventQueue.close();
    }
}


main();