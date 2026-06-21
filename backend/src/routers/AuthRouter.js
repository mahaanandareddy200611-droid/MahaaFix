const express = require("express")

const authentication = express.Router()

const {signup , login} = require("../validators/authvalidator")

const validate  = require("../validators/validate");

const {Login ,Signup }= require("../controllers/AuthController")

authentication.post("/signup",validate(signup),Signup)
authentication.post("/login",validate(login),Login)

module.exports=authentication