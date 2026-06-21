    const express = require("express");

    const userroutes= express.Router();

    const {profile} =  require("../controllers/usercontroller");

    const Auth = require("../middleware/Auth");

    userroutes.get("/",Auth,profile);

    module.exports=userroutes;
        