const express = require("express")
const Auth = require("../../middleware/Auth")
const upload = require("../../middleware/upload")
const uploadFiles=require("./Media.Countroller")
const Router = express.Router();

Router.post("/upload",Auth,upload.array("files",7),uploadFiles)

module.exports= router