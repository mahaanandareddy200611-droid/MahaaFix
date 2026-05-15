const express = require("express");

const userLogin = express.Router();

const {userInfo} =  require("../controllers/usercontroller");

userLogin.post("/",userInfo);

module.exports=userLogin;
    