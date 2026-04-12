import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/ApplicaDB.js"
import Router from "./Routes/Router.js"
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json());

app.use("/api/auth", Router);
app.get('/', async(req,res)=>{
    res.json("Hello World");
})

app.use((req, res, next) => {
  res.success = (message, data = null) => {
    return res.status(200).json({
      status: "successful",
      message,
      data,
    });
  };

  next();
});
app.use((req, res, next) => {
  if (res.locals.success) {
    return res.status(res.locals.success.statusCode).json({
      status: res.locals.success.status,
      message: res.locals.success.message,
      data: res.locals.success.data
    });
  }
  next();
});
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
  });
});

app.listen(PORT,()=> {
    connectDB();
   console.log(`Listening on port ${PORT}`);
})