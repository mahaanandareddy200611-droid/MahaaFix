
import api from "../api/api";

export const getCurrentUser = () => {
    return api.get("/profile");
};

export const getOnlineWorkers = (config = {}) => {
    return api.get("/profile/online-workers", config);
};