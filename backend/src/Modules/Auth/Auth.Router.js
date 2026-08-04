const express = require("express")

const authentication = express.Router()

const {signup , login} = require("./Auth.Validator")

const validate  = require("../../utils/validate");

const {Login ,Signup }= require("./Auth.Contoller")

authentication.post("/signup",validate(signup),Signup)
authentication.post("/login",validate(login),Login)

module.exports=authentication