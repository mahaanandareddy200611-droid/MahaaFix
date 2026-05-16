const express = require("express");

const app = express();

const connectDB = require("./src/config/db");

const jobrouter = require("./src/routers/jobrouter");

const authentication = require("./src/routers/AuthRouter");

require("dotenv").config();



app.use(express.json());

app.use("/api/v1/auth",authentication);

app.use("/api/v1/job",jobrouter);
// get 
app.get("/login/test",(req,res)=>{
  console.log("user entered login");

  console.log(req.method);
  console.log(req.url);

  res.send("login not yet created");
});

// post == create
app.post("/jobs/:id",(req,res)=>{
  console.log("post  request recived from /jobs/:id ");
  console.log(req.body);
  console.log(req.method);
  console.log(req.url);
  console.log(req.params.id);
  res.status(200).json({
    success : true,
    message : "jobs are fetched",
    status : "pending",
  });
  
});


// CONNECT DATABASE
connectDB();

// server 
app.get("/", (req, res) => {
  res.send("MahaaFix Backend Running 🚀");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});