const Idempotancy = require("./idempotancy.model");
const AppError = require("../../utils/AppError")

exports.checkAndCreate = async ({idempotancyKey,userId,endpoint})=>{

    const existing = await Idempotancy.findOne({
        idempotancyKey,
        userId: userId,
        endpoint,
    });

    if (existing){
        throw new AppError(
            "Duplicate request This Idempotancy key has alredy exists",409
        )
    }

    try{
        const record = await Idempotancy.create({
            idempotancyKey,
            userId:userId,
            endPoint,
        })
        return record
    } catch (error){
        // for any other duplicates 
        if(error.code === 11000){
            throw new AppError(
            "Duplicate request This Idempotancy key has alredy exists",409
        )
        }

        throw error
    }
}