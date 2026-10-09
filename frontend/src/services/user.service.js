
import api from "../api/api";

export const getCurrentUser = () => {
    return api.get("/profile");
};