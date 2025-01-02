import { Router } from "express";
import {
  registerTeacher,
  loginTeacher,
  logoutTeacher,
  getTeacher,
} from "../controllers/teacher.controller.js";
import { verifyJWT } from "../middlewares/teacherAuth.middleware.js";

const router = Router();

router.route("/get-teacher").get(verifyJWT, getTeacher);
router.route("/register-teacher").post(registerTeacher);
router.route("/login-teacher").post(loginTeacher);
router.route("/logout-teacher").post(verifyJWT, logoutTeacher);

export default router;
