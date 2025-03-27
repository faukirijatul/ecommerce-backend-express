import express from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import connectDb from "./config/mongodb.js";
import cookieParser from "cookie-parser";

const app = express();

connectDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// routes
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";

const apiVersion = "/api/v1";

app.use(`${apiVersion}/users`, userRouter);
app.use(`${apiVersion}/products`, productRouter);

export default app;
