
import api from "../api/api";

const WORK_RECORDS_URL = "/api/v1/work";

function mutationConfig(idempotencyKey) {
    if (
        typeof idempotencyKey !== "string" ||
        !idempotencyKey.trim()
    ) {
        throw new Error("A valid idempotency key is required.");
    }

    return {
        headers: {
            "Idempotency-Key": idempotencyKey,
        },
    };
}

export const createWorkRecord = (data, idempotencyKey) =>
    api.post(
        `${WORK_RECORDS_URL}/WorkRecord`,
        data,
        mutationConfig(idempotencyKey)
    );

export const getAllWorkRecords = (params = {}, config = {}) =>
    api.get(
        `${WORK_RECORDS_URL}/allWorkRecords`,
        { ...config, params }
    );

export const getWorkRecordById = (id, config = {}) =>
    api.get(
        `${WORK_RECORDS_URL}/work-records/${id}`,
        config
    );

export const getMyWorkRecords = (params = {}, config = {}) =>
    api.get(
        `${WORK_RECORDS_URL}/work-records/my`,
        { ...config, params }
    );

export const getWorkRecordsCreatedByMe = (
    params = {},
    config = {}
) =>
    api.get(
        `${WORK_RECORDS_URL}/work-records`,
        { ...config, params }
    );

export const updateWorkRecord = (id, data, key) =>
    api.patch(
        `${WORK_RECORDS_URL}/work-records/${id}`,
        data,
        mutationConfig(key)
    );

export const deleteWorkRecord = (id, key) =>
    api.delete(
        `${WORK_RECORDS_URL}/work-records/${id}`,
        mutationConfig(key)
    );

export const addReview = (id, data, key) =>
    api.post(
        `${WORK_RECORDS_URL}/work-records/${id}/review`,
        data,
        mutationConfig(key)
    );

export const updateReview = (id, data, key) =>
    api.patch(
        `${WORK_RECORDS_URL}/work-records/${id}/review/update`,
        data,
        mutationConfig(key)
    );

export const addComment = (id, data, key) =>
    api.post(
        `${WORK_RECORDS_URL}/work-records/${id}/comment`,
        data,
        mutationConfig(key)
    );