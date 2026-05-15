const express = require("express");

const connectDB = require("../backend/src/config/db");

const jobrouter = require("../backend/src/routers/jobrouter");

const userLogin = require("./src/routers/userrouter");



require("dotenv").config();

const app = express();
app.use(express.json());

app.use("/login",userLogin);


app.use("/jobs/users",jobrouter);

app.get("/login/test",(req,res)=>{
  console.log("user entered login");

  console.log(req.method);
  console.log(req.url);
  
  res.send("login not yet created");
});


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

app.get("/", (req, res) => {
  res.send("MahaaFix Backend Running 🚀");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});