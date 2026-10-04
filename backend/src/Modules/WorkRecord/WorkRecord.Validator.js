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



const updateWorkRecordSchema = Joi.object({

    title: Joi.string()
        .trim()
        .max(100),

    description: Joi.string()
        .trim()
        .min(25),

    category: Joi.string()
        .trim(),

    type: Joi.string()
        .valid(
            "New",
            "installation",
            "repair",
            "maintenance",
            "replacement",
            "inspection",
            "service"
        ),

    customer: Joi.string(),

    amount: Joi.number()
        .min(0),

    visibility: Joi.string()
        .valid("public", "private"),

    customerWhatsappNumber: Joi.string()
        .trim()

}).min(1);

const reviewSchema = Joi.object({

    rating: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required(),

    review: Joi.string()
        .trim()
        .max(1000)
        .required()

});

const updateReviewSchema = Joi.object({

    rating: Joi.number()
        .integer()
        .min(1)
        .max(5),

    review: Joi.string()
        .trim()
        .max(1000)

}).min(1);

const commentSchema = Joi.object({

    comment: Joi.string()
        .trim()
        .min(1)
        .max(1000)
        .required()

});

module.exports = {
    createWorkRecordSchema,
    updateWorkRecordSchema,
    reviewSchema,
    updateReviewSchema,
    commentSchema
};
