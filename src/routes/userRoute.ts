import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { deleteUserhandler, fetchUserHandler, fetchUsersHandler } from "../controllers/userController.js";
import { authorizeRoles } from "../middlewares/roleAuth.js";

const router = Router();

router.route("/users").get(auth, authorizeRoles("admin"), fetchUsersHandler);

router.route("/users/:id").get(auth, authorizeRoles("admin"), fetchUserHandler).delete(auth, authorizeRoles("admin"), deleteUserhandler);

export default router;
