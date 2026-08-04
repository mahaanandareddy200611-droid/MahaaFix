exports.uploadFiles = asyncHandler(async(req,res)=>{

    const media = await mediaService.uploadFiles(
        req.files,
        req.user
    );

    res.status(201).json({
        success:true,
        data:media
    });

});