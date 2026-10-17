const IORedis = require("ioredis")

const REDIS_URL  = process.env.REDIS_URL

function createRedisConnection({ worker = false } = {}) {

    const connection = new IORedis(REDIS_URL, {

        // Background workers must keep retrying until Redis
        // becomes available again.
        maxRetriesPerRequest: worker ? null : 1,

        // Gradually increase the delay between reconnection attempts.
        retryStrategy(times) {
            return Math.min(times * 500, 5000);
        }
    });

    connection.on("error", (error) => {
        console.error(
            `[Redis ${worker ? "Worker" : "Producer"}]`,
            error.message
        );
    });

    return connection;
}






function getRedisConnectionOptions({ worker = false } = {}) {
    const redisUrl = new URL(
        process.env.REDIS_URL || "redis://127.0.0.1:6379"
    );

    if (!["redis:", "rediss:"].includes(redisUrl.protocol)) {
        throw new Error("REDIS_URL must use redis:// or rediss://");
    }

    const options = {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),

        // Producers should fail reasonably quickly if Redis is down.
        // Workers should keep waiting for Redis to reconnect.
        maxRetriesPerRequest: worker ? null : 1
    };

    if (redisUrl.username) {
        options.username = decodeURIComponent(redisUrl.username);
    }

    if (redisUrl.password) {
        options.password = decodeURIComponent(redisUrl.password);
    }

    if (
        redisUrl.pathname &&
        redisUrl.pathname !== "/"
    ) {
        const database = Number(redisUrl.pathname.slice(1));

        if (!Number.isInteger(database) || database < 0) {
            throw new Error("Invalid Redis database number in REDIS_URL");
        }

        options.db = database;
    }

    if (redisUrl.protocol === "rediss:") {
        options.tls = {};
    }

    return options;
}


module.exports = {
    createRedisConnection,
    getRedisConnectionOptions
};