import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// routes
import studentRouter from "./routes/student.routes.js";
import teacherRouter from "./routes/teacher.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "20kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());

// routes declartion
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/teacher", teacherRouter);

export { app };
