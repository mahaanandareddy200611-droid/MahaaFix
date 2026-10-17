require("dotenv").config();

const {
    createRedisConnection
} = require("../infrastructure/redis/redis.connection");


async function main() {

    const redis = createRedisConnection();

    try {

        // 1. Check connectivity.
        const pong = await redis.ping();

        console.log("Redis ping:", pong);

        // 2. Write a temporary test value.
        await redis.set(
            "mahaafix:healthcheck",
            "connected",
            "EX",
            10
        );

        // 3. Read it back.
        const value = await redis.get(
            "mahaafix:healthcheck"
        );

        console.log("Redis test value:", value);

        if (pong !== "PONG" || value !== "connected") {
            throw new Error("Redis health check failed");
        }

        console.log("Redis connection verified successfully");

    } catch (error) {

        console.error(
            "Redis health check failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {

        await redis.quit();

    }
}


main();