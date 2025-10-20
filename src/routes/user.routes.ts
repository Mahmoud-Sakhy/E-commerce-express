import express from "express";
import { getAllUsers, login, logout, register } from "../controllers/user.controller";
import { sendVerificationCode, verifyCode } from "../controllers/verification.controller";
import { requestPasswordReset, resetPassword, verifyResetCode } from "../controllers/password.controller";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", getAllUsers); 
// Verification routes
router.post("/send-verification", sendVerificationCode);
router.post("/verify", verifyCode);

// ✅ Password reset routes
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
export default  router;