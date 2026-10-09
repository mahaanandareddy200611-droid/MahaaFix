
import api from "../api/api";

const JOBS_URL = "/api/v1/jobs";

function idempotencyConfig(key) {
    if (typeof key !== "string" || !key.trim()) {
        throw new Error("An idempotency key is required.");
    }

    return {
        headers: {
            "Idempotency-Key": key,
        },
    };
}

export const getAvailableJobs = (params = {}, config = {}) =>
    api.get(`${JOBS_URL}/`, { ...config, params });

export const getMyJobs = (params = {}, config = {}) =>
    api.get(`${JOBS_URL}/my-jobs`, { ...config, params });

export const getJobById = (id, config = {}) =>
    api.get(`${JOBS_URL}/${id}`, config);

export const createJob = (data, key) =>
    api.post(
        `${JOBS_URL}/create`,
        data,
        idempotencyConfig(key)
    );

export const assignJob = (id, workerId, key) =>
    api.post(
        `${JOBS_URL}/${id}/assign`,
        { workerid: workerId },
        idempotencyConfig(key)
    );

export const acceptJob = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/accepted`,
        {},
        idempotencyConfig(key)
    );

export const declineJob = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/reject`,
        {},
        idempotencyConfig(key)
    );

export const markJobChecking = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/checking`,
        {},
        idempotencyConfig(key)
    );

export const submitJobEstimate = (id, data, key) =>
    api.patch(
        `${JOBS_URL}/${id}/EstimateSubmitted`,
        data,
        idempotencyConfig(key)
    );

export const approveJobEstimate = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/Approval`,
        { decision: "InProgress" },
        idempotencyConfig(key)
    );

export const completeJob = (id, afterMedia, key) =>
    api.patch(
        `${JOBS_URL}/${id}/WorkCompleted`,
        { afterMedia },
        idempotencyConfig(key)
    );

export const verifyJob = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/verified`,
        {},
        idempotencyConfig(key)
    );

export const requestJobRework = (id, reworkProof, key) =>
    api.patch(
        `${JOBS_URL}/${id}/ReworkRequired`,
        { reworkProof },
        idempotencyConfig(key)
    );

export const resumeJobAfterRework = (id, key) =>
    api.patch(
        `${JOBS_URL}/${id}/status`,
        { newStatus: "InProgress" },
        idempotencyConfig(key)
    );