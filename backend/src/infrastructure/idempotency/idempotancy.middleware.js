const AppError = require("../../utils/AppError")
const idempotancyService = require("./idempotancy.service")

const { validateIdempotancyKey } = require("./idempotancy.validator")

const idempotancyMiddleware = async (req,res,next)=>{
    const key = req.get("Idempotency-key")

    const validation = validateIdempotancyKey(key)

    if (!validation.valid){
        return res.status(400).json({
            success: false,
            message: "Valid Idempotancy-key header is required",
        })
    }

    if(!req.user ||!req.user.id){
        return res.status(401).json({
            success: false,
            message: "Authentication needed for idempotancy",
        })
    }
    const endPoint =`${req.method}:${req.baseUrl}${req.path}`;

    const result =await idempotancyService.checkAndCreate({
        idempotancyKey: validation.value,
        userId:req.user.id,
        endPoint,
    });

    if(result.existing){
        
        throw new AppError("duplicate request",409)
    }
    next();
}

module.exports = idempotancyMiddleware;