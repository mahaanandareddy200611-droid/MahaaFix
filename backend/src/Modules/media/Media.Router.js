const express = require("express")

const MediaRouter =express.Router()


const {capture}= require("./Media.Controller")
const upload = require("../../middleware/upload")
const Auth = require("../../middleware/Auth")
MediaRouter.post("/capture",Auth,upload.single("file"),capture)

module.exports = MediaRouter