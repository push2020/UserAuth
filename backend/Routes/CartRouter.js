import express from "express";
import {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
} from "../Controllers/CartController.js";
import { userAuthentication } from "../Middlewares/UserValidation.js";
import {
  addItemValidation,
  updateQuantityValidation,
} from "../Middlewares/CartValidation.js";

const router = express.Router();

// All routes require authentication
router.use(userAuthentication);

// Get user's cart
router.get("/", getCart);

// Add item to cart
router.post("/add", addItemValidation, addItemToCart);

// Update item quantity
router.put("/item/:itemId", updateQuantityValidation, updateItemQuantity);

// Remove item from cart
router.delete("/item/:itemId", removeItemFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;
