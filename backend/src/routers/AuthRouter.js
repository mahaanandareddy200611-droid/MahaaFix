const express = require("express")

const authentication = express.Router()

const {Login ,Signup }= require("../controllers/AuthController")

authentication.post("/signup",Signup)
authentication.post("/login",Login)

module.exports=authentication