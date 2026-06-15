import OrderModel from "../Models/order.js";

// Creates a new order document for the authenticated user and stores it in
// the database as a permanent snapshot of what was ordered, where, and for how much.
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      orderId,
      items,
      subtotal,
      deliveryFee,
      gst,
      platformFee,
      total,
      address,
      estimatedMinutes,
    } = req.body;

    const order = new OrderModel({
      userId,
      orderId,
      items,
      subtotal,
      deliveryFee,
      gst,
      platformFee,
      total,
      address,
      estimatedMinutes,
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      code: 201,
      message: "Order placed successfully",
      data: savedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};

// Returns all orders for the authenticated user, newest first, capped at 50.
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await OrderModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      code: 200,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};
