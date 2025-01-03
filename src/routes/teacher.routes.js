import { Router } from "express";
import {
  registerTeacher,
  loginTeacher,
  logoutTeacher,
  getTeacher,
  refreshAccessToken,
  changePassword,
  updateTeacherProfile,
} from "../controllers/teacher.controller.js";
import { verifyJWT } from "../middlewares/teacherAuth.middleware.js";

const router = Router();

router.route("/get-teacher").get(verifyJWT, getTeacher);
router.route("/register-teacher").post(registerTeacher);
router.route("/login-teacher").post(loginTeacher);
router.route("/logout-teacher").post(verifyJWT, logoutTeacher);
router.route("/refresh-accessToken").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-teacherProfile").post(verifyJWT, updateTeacherProfile);

export default router;
