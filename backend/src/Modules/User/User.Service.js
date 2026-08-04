const AppError = require("../utils/AppError");
const User = require("../models/User");

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