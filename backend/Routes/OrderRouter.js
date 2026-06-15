import express from "express";
import { createOrder, getUserOrders } from "../Controllers/OrderController.js";
import { userAuthentication } from "../Middlewares/UserValidation.js";
import { createOrderValidation } from "../Middlewares/OrderValidation.js";

const router = express.Router();

// All order routes require a valid JWT.
router.use(userAuthentication);

// Save a new order to the database.
router.post("/", createOrderValidation, createOrder);

// Retrieve all orders for the authenticated user.
router.get("/", getUserOrders);

export default router;
