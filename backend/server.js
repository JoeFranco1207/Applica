import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/ApplicaDB.js"
import Router from "./Routes/UserRouter.js"
import User from "./Model/UserSchema.js";
import Job from "./Model/JobSchema.js";
import JobseekerRouter from "./Routes/JobseekerRouter.js";
import EmployerRouter from "./Routes/EmployerRouter.js";
import AdminRouter from "./Routes/AdminRouter.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use("/api/admin", AdminRouter);

app.use((req, res, next) => {
  res.success = (appSuccessful) => {
    return res.status(appSuccessful.statusCode).json({
      status: appSuccessful.status,
      message: appSuccessful.message,
      data: appSuccessful.data
    });
  };
  next();
});


app.use("/api/auth", Router);
app.get("/api/jobs", async (req, res, next) => {
  try {
    const jobs = await Job.find().populate("createdBy", "firstName email");
    res.success({
      statusCode: 200,
      status: "success",
      message: "Jobs fetched successfully",
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
});
app.use("/api/jobseeker", JobseekerRouter);
app.use("/api/employer", EmployerRouter);
app.get('/', async(req,res)=>{
  
    const user = await User.find();
    res.json(user);
  
})

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