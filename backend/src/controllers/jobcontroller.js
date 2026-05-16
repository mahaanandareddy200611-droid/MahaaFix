exports.getjobs = (req,res)=>{
    res.status(200).json({
        success: true,
        message : "jobs are being featched"
    })
}
exports.createJobs = (req,res)=>{
    res.status(201).json({
        success:true,
        message : " jobs are created "
    })
}   