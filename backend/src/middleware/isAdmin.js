const AppError = require("../utils/AppError");

const isAdmin = (req, res, next) => {
    const allowedEmails = (process.env.ADMIN_EMAIL || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    const email = String(req.user?.email || "")
        .trim()
        .toLowerCase();

    if (
        req.user?.role !== "admin" ||
        !allowedEmails.includes(email)
    ) {
        throw new AppError(
            "Administrator access is required",
            403
        );
    }

    return next();
};

module.exports = isAdmin;