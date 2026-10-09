function getApiError(error) {
    // Axios request reached the server and the server responded.
    if (error.response) {
        const status = error.response.status;

        const data = error.response.data;

        return {
            type: "HTTP_ERROR",
            status,
            message:
                data?.message ||
                data?.error ||
                "The server returned an error.",
            data,
        };
    }

    // Request was created but no response was received.
    if (error.request) {
        return {
            type: "NETWORK_ERROR",
            status: null,
            message:
                "The server could not be reached. Check your connection or whether the backend is running.",
            data: null,
        };
    }

    // Something went wrong while creating/configuring the request.
    return {
        type: "CLIENT_ERROR",
        status: null,
        message: error.message || "An unexpected client error occurred.",
        data: null,
    };
}

export default getApiError;