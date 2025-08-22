import express from "express";
import { getUser, updateUser } from "../Controllers/UserController.js";
import { userValidation } from "../Middlewares/UserValidation.js";

const router = express.Router();

router.get("/:id", getUser);
router.put("/:id", userValidation, updateUser);

export default router;
