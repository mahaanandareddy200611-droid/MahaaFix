
import api from "../api/api";

function idempotencyConfig(key) {
    if (typeof key !== "string" || !key.trim()) {
        throw new Error("An idempotency key is required.");
    }

    return {
        headers: {
            "Idempotency-Key": key,
        },
        timeout: 10000,
    };
}

export const goWorkerOnline = (key) =>
    api.post(
        "/api/v1/auth/online",
        {},
        idempotencyConfig(key)
    );

export const sendWorkerHeartbeat = () =>
    api.post(
        "/api/v1/auth/heartbeat",
        {},
        { timeout: 10000 }
    );

export const goWorkerOffline = (key) =>
    api.post(
        "/api/v1/auth/offline",
        {},
        idempotencyConfig(key)
    );