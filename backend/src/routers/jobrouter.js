const express = require("express");

const jobrouter = express.Router();

const {
    createJobs,
    getjobs
} = require("../controllers/jobcontroller");



jobrouter.get("/worker",getjobs);

jobrouter.post("/",createJobs);

module.exports=jobrouter;
