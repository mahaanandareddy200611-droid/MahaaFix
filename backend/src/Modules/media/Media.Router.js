const express = require("express")

const MediaRouter =express.Router()


const {capture}= require("./Media.Controller")
const upload = require("../../middleware/upload")
const Auth = require("../../middleware/Auth")
const idempotancyMiddleware = require("../../infrastructure/idempotency/idempotancy.middleware")
MediaRouter.post("/capture",Auth,upload.single("file"),idempotancyMiddleware,capture)

module.exports = MediaRouter