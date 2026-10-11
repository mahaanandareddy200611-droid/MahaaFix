const AppError = require("../../utils/AppError");
const User = require("../../models/User");
const {
    WORKER_HEARTBEAT_TTL_MS,
} = require("../../config/presence");

exports.profile=async(user)=>{
    // fetech currect user details
        const findUser = await User.findById(user.id)
        if(!findUser){
            throw new AppError("coudn't find user ",403);
            
                            // if any deleted user by admin can still come here but no data in DB he will be in this ERROR
                 // banned users , deleted accounts suspended accounts 
                //                              // old tokens from frontend may give access till here
            }

        return findUser
}

exports.getOnlineWorkers = async () => {
    const cutoff = new Date(
        Date.now() - WORKER_HEARTBEAT_TTL_MS
    );

    return User.find({
        role: "worker",
        isOnline: true,
        lastHeartbeat: {
            $gte: cutoff,
        },
    })
        .select(
            "_id name mobileNumber isOnline lastSeen lastHeartbeat WorkRecordsCount"
        )
        .sort({
            lastHeartbeat: -1,
        })
        .limit(100)
        .lean();
};