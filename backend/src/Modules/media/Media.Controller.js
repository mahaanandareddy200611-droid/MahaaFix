const asyncHandler = require("../../middleware/asyncHandler");
const MediaService = require("./Media.Service")
exports.capture = asyncHandler(async(req,res)=>{
    const file = req.file

    const media = await MediaService(file,req.user.id)
    
    return res.status(200).json({
        success:true,
        message:"Successfully media uploaded",
        data:media,
    })
})

