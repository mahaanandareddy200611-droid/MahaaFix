const { options } = require("joi");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto",
                ...options,
             },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

module.exports = { uploadToCloudinary };