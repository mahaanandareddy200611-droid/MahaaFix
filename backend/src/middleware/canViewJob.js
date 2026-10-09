
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
    const job = req.job;
    const user = req.user;

    const role = String(user?.role || "").toLowerCase();
    const userId = String(user?.id || user?._id || "");

    if (role === "admin" || role === "operator") {
        return next();
    }

    if (role === "customer") {
        const ownerId = String(job.customer?.userid || "");

        if (ownerId !== userId) {
            throw new AppError(
                "You are not the owner of this job",
                403
            );
        }

        return next();
    }

    if (role === "worker") {
        const assignedWorkerId = String(
            job.worker?.workerid || ""
        );

        if (assignedWorkerId === userId) {
            return next();
        }

        if (
            job.status === "Created" &&
            !job.worker?.workerid
        ) {
            req.jobPreviewOnly = true;
            return next();
        }
    }

    throw new AppError(
        "You are not permitted to view this job",
        403
    );
});