const Joi = require("joi");

const createWorkRecordSchema = Joi.object({
    title: Joi.string()
        .trim()
        .max(100)
        .required(),

    description: Joi.string()
        .trim()
        .min(25)
        .required(),

    category: Joi.string()
        .trim()
        .required(),

    type: Joi.string()
        .valid(
            "New",
            "installation",
            "repair",
            "maintenance",
            "replacement",
            "inspection",
            "service"
        )
        .required(),

    city: Joi.string()
        .trim()
        .required(),

    amount: Joi.number()
        .min(0)
        .required(),

    visibility: Joi.string()
        .valid("public", "private")
        .default("public"),

    customerWhatsappNumber: Joi.string()
        .trim()
        .required(),

    engagementType: Joi.string()
        .valid("work", "contract")
        .default("work"),

    customer: Joi.string()
        .optional()
});

module.exports = {
    createWorkRecordSchema
};