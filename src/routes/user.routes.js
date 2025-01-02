import { Router } from "express";
import {
  loginStudent,
  logoutStudent,
  registerStudent,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register-student").post(registerStudent);
router.route("/login-student").post(loginStudent);
router.route("/logout-student").post(verifyJWT, logoutStudent);
export default router;
