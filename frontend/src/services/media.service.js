
import api from "../api/api";

export const uploadMedia = (file, idempotencyKey) => {
    if (!(file instanceof File)) {
        throw new Error("A file is required.");
    }

    if (!idempotencyKey) {
        throw new Error("An idempotency key is required.");
    }

    const formData = new FormData();
    formData.append("file", file);

    return api.post(
        "/api/v1/Media/capture",
        formData,
        {
            headers: {
                "Idempotency-Key": idempotencyKey,
            },
            timeout: 60000,
        }
    );
};