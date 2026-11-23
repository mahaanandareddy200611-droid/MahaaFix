const DEFAULT_WORKER_HEARTBEAT_TTL_MS = 120_000;

function resolveWorkerHeartbeatTtl(rawValue) {
    const configuredTtl = Number(rawValue);

    if (
        Number.isFinite(configuredTtl) &&
        configuredTtl > 0
    ) {
        return configuredTtl;
    }

    return DEFAULT_WORKER_HEARTBEAT_TTL_MS;
}

const WORKER_HEARTBEAT_TTL_MS =
    resolveWorkerHeartbeatTtl(
        process.env.WORKER_HEARTBEAT_TTL_MS
    );

function getHeartbeatCutoff(
    nowMs = Date.now(),
    ttlMs = WORKER_HEARTBEAT_TTL_MS
) {
    if (!Number.isFinite(nowMs)) {
        throw new TypeError("nowMs must be a finite number");
    }

    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
        throw new TypeError("ttlMs must be a positive number");
    }

    return new Date(nowMs - ttlMs);
}

module.exports = {
    DEFAULT_WORKER_HEARTBEAT_TTL_MS,
    WORKER_HEARTBEAT_TTL_MS,
    resolveWorkerHeartbeatTtl,
    getHeartbeatCutoff,
};