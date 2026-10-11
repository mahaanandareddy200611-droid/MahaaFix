const express = require("express");

const userroutes = express.Router();

const {
    profile,
    listOnlineWorkers,
} = require("./User.Controller");

const Auth = require("../../middleware/Auth");
const isAdmin = require("../../middleware/isAdmin");

userroutes.get(
    "/online-workers",
    Auth,
    isAdmin,
    listOnlineWorkers
);

userroutes.get("/", Auth, profile);

module.exports = userroutes;