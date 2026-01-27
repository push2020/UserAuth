import CartModel from "../Models/cart.js";

// Helper function to generate unique item ID
const generateItemId = (category, itemName) => {
  return `${category}_${itemName}`.replace(/\s+/g, "_").toLowerCase();
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = new CartModel({ userId, items: [] });
      await cart.save();
    }

    return res.json({
      code: 200,
      message: "Cart retrieved successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { item, category, quantity = 1 } = req.body;

    if (!item || !category) {
      return res.status(400).json({
        code: 400,
        message: "Item and category are required",
      });
    }

    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = new CartModel({
        userId,
        items: [],
        restaurantId: req.body.restaurantId || null,
      });
    }

    const itemId = generateItemId(category, item.name);
    const existingItemIndex = cart.items.findIndex(
      (cartItem) => cartItem.itemId === itemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        itemId,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image,
        isVeg: item.isVeg || false,
        description: item.description,
        category,
        quantity,
      });
    }

    await cart.save();

    return res.json({
      code: 200,
      message: "Item added to cart successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        code: 400,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.itemId === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: "Item not found in cart",
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return res.json({
      code: 200,
      message: "Item quantity updated successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter((item) => item.itemId !== itemId);
    await cart.save();

    return res.json({
      code: 200,
      message: "Item removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    return res.json({
      code: 200,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};
