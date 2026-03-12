import express from "express";
import {
  registerHandler,
  verifyUserEmailHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/authController.js";
import { auth } from "../middlewares/auth.js";

import { googleCallbackHandler, oAuthHandler } from "../controllers/googleOauth.js";

const router = express.Router();

router.route("/register").post(registerHandler);
router.route("/login").post(loginHandler);
router.route("/verify-email").post(auth, verifyUserEmailHandler);
router.route("/refresh").post(refreshTokenHandler);
router.route("/forgot").post(forgotPasswordHandler);
router.route("/reset").post(resetPasswordHandler);
router.route("/logout").get(auth, logoutHandler);

router.route("/google/url").get(oAuthHandler);
router.route("/google/callback").get(googleCallbackHandler);

export default router;
