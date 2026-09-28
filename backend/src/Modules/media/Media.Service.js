const Media = require("../../models/Media");
const AppError = require("../../utils/AppError");
const {uploadToCloudinary} = require("../../config/cloudinary");

const MediaService = async (file, userId) => {

    if (!file) {
        throw new AppError("File is required", 400);
    }

    if (!userId) {
        throw new AppError("User not authenticated", 401);
    }


    const type = file.mimetype.startsWith("image/")
        ? "image"
        : file.mimetype.startsWith("video/")
        ? "video"
        : file.mimetype.startsWith("audio/")
        ? "voice"
        : file.mimetype === "application/pdf"
        ? "pdf"
        : null;

    if (!type) {
        throw new AppError(
            "Unsupported file type. Only image, video, audio and PDF are allowed.",
            400
        );
    }

    const uploadResult = await uploadToCloudinary(file.buffer);


    const media = await Media.create({
        uploadedBy: userId,

        type,

        originalName: file.originalname,

        mimeType: file.mimetype,

        url: uploadResult.secure_url,

        publicId: uploadResult.public_id,

        size: file.size,

        status: "completed"
    });

    return media;
};


module.exports = MediaService;