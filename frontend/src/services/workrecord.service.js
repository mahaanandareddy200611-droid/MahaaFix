import api from "../api/api";


export const createWorkRecord =(data,idempotencyKey)=>{
    return api.post("/api/v1/work/WorkRecord",data ,{
        headers:{"Idempotency-Key":idempotencyKey}
    });
};
export const getAllWorkRecords = (params) => {
    return api.get("/api/v1/work/allWorkRecords", {
        params
    });
};

export const getWorkRecordById = (id) => {
    return api.get(`/api/v1/work/work-records/${id}`);
};

export const addReview = (id, data) => {
    return api.post(`/api/v1/work/work-records/${id}/review`, data);
};

export const updateReview = (id, data) => {
    return api.patch(`/api/v1/work/work-records/${id}/review/update`, data);
};

export const addComment = (id, data) => {
    return api.post(`/api/v1/work/work-records/${id}/comment`, data);
};