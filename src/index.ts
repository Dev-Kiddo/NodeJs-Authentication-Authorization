import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/", userRouter);

export default app;
