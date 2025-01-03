import { Router } from "express";
import {
  getStudent,
  loginStudent,
  logoutStudent,
  registerStudent,
  refreshAccessToken,
  changePassword,
  updateStudentProfile,
  updateStudentAvatar,
} from "../controllers/student.controller.js";
import { verifyJWT } from "../middlewares/studentAuth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/get-student").get(verifyJWT, getStudent);
router.route("/register-student").post(registerStudent);
router.route("/login-student").post(loginStudent);
router.route("/logout-student").post(verifyJWT, logoutStudent);
router.route("/refresh-accessToken").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-studentProfile").patch(verifyJWT, updateStudentProfile);
router
  .route("/avatar-student")
  .patch(verifyJWT, upload.single("studentPhoto"), updateStudentAvatar);
export default router;
