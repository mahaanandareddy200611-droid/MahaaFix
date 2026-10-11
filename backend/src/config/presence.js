const configuredTtl = Number(
    process.env.WORKER_HEARTBEAT_TTL_MS
);

const WORKER_HEARTBEAT_TTL_MS =
    Number.isFinite(configuredTtl) && configuredTtl > 0
        ? configuredTtl
        : 120_000; // 2 minutes

module.exports = {
    WORKER_HEARTBEAT_TTL_MS,
};