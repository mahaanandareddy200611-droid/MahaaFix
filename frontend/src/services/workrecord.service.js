import api from "../api/api";

const WORK_RECORDS_URL = "/api/v1/work";

// Create a WorkRecord.
//
// The caller provides the payload and an idempotency key.
// The backend remains responsible for correctness.
export const createWorkRecord = (data, idempotencyKey) => {
    if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim() === ""
    ) {
        throw new Error(
            "Creating a WorkRecord requires an idempotency key."
        );
    }

    return api.post(
        `${WORK_RECORDS_URL}/WorkRecord`,
        data,
        {
            headers: {
                "Idempotency-Key": idempotencyKey,
            },
        }
    );
};

// Public WorkRecord listing with backend-supported filters.
export const getAllWorkRecords = (params = {}) => {
    return api.get(`${WORK_RECORDS_URL}/allWorkRecords`, {
        params,
    });
};

// Fetch one WorkRecord by its ID.
export const getWorkRecordById = (id) => {
    return api.get(`${WORK_RECORDS_URL}/work-records/${id}`);
};

// Create a review.
export const addReview = (id, data) => {
    return api.post(
        `${WORK_RECORDS_URL}/work-records/${id}/review`,
        data
    );
};

// Update an existing review.
export const updateReview = (id, data) => {
    return api.patch(
        `${WORK_RECORDS_URL}/work-records/${id}/review/update`,
        data
    );
};

// Add a comment to a WorkRecord.
export const addComment = (id, data) => {
    return api.post(
        `${WORK_RECORDS_URL}/work-records/${id}/comment`,
        data
    );
};