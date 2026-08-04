const Joi = require("joi")

exports.createjob = Joi.object({
    title:Joi.string().required(),

    description:Joi.string().required(),

    category:Joi.string().valid(
        "repair","new-installation","inspection","cleaning","emergency"
    ).required(),
    
    subCategory:Joi.string().valid(
        "Electrical","Plumbing","AC-repair","House-cleaning","Bathroom-cleaning","ApplianceRepair"
    ).required(),

    status:Joi.string().default("Created"),

    address:Joi.object({
        city:Joi.string().required(),
        street:Joi.string().required(),
        houseNo:Joi.string().required(),
        newMobile:Joi.string().required(),
            
        colony:Joi.string().allow(""),
        landMark:Joi.string().allow("")
    }).required(),

    budget:Joi.number().required()
    .messages({
        "number.base":"Budget must be numeric",
        "any.required":"Budget is required"
    }),
    
    beforePhotos:Joi.array().items(Joi.string().uri()).required(),
    beforeVideos:Joi.array().items(Joi.string().uri()).required(),

})