import { Router } from "express";
import {
  getStudent,
  loginStudent,
  logoutStudent,
  registerStudent,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/studentAuth.middleware.js";

const router = Router();

router.route("/get-student").get(verifyJWT, getStudent);
router.route("/register-student").post(registerStudent);
router.route("/login-student").post(loginStudent);
router.route("/logout-student").post(verifyJWT, logoutStudent);
export default router;
