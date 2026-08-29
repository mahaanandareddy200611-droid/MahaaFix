require("dotenv").config();
const app = require("./src/app")
const connectDB = require("./src/config/db");


const startServer = async()=>{
  try {
    // CONNECT DATABASE

    // server 

    await connectDB()

    app.listen(process.env.PORT, () => {
      console.log("Server is running on port", process.env.PORT);
    });
    
  } catch (error) {
    
  console.error("Server startup failed:", error.message);
  process.exit(1);    
  }
}
startServer()


