import express from "express";
import { getConfig } from "../Controllers/ConfigController.js";
import { ConfigValidation } from "../Middlewares/ConfigValidation.js";

const router = express.Router();

router.get("/begin", getConfig);

export default router;
