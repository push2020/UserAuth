import OrderModel from "../Models/order.js";
import { getIO } from "../socket.js";

// Fixed restaurant origin used as the rider's starting point on the map.
const RESTAURANT_LAT = 18.5204;
const RESTAURANT_LNG = 73.8567;

// Total simulation duration in ms — must match the final setTimeout in simulateOrderProgress.
const SIMULATION_DURATION_MS = 3 * 60 * 1000;

/**
 * Derives a deterministic delivery destination from the orderId string so that
 * every order always maps to the same destination without storing extra state.
 * The offset keeps the destination within ~2 km of the restaurant.
 */
const getDeliveryDestination = (orderId) => {
  let seed = 0;
  for (const char of orderId) {
    seed = (seed * 31 + char.charCodeAt(0)) & 0xffffffff;
  }
  const latOffset = (((seed & 0xff) / 255) * 0.036) - 0.018;
  const lngOffset = ((((seed >> 8) & 0xff) / 255) * 0.036) - 0.018;
  return {
    lat: RESTAURANT_LAT + latOffset,
    lng: RESTAURANT_LNG + lngOffset,
  };
};

/**
 * Updates the order's status (and optional riderLocation) in the database
 * and emits an order_update event to the order's Socket.IO room.
 */
const emitStatusUpdate = async (orderId, status, riderLocation) => {
  const io = getIO();
  const update = { status };
  if (riderLocation) update.riderLocation = riderLocation;
  await OrderModel.findOneAndUpdate({ orderId }, update);
  if (io) {
    io.to(`order_${orderId}`).emit("order_update", {
      status,
      riderLocation: riderLocation ?? null,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Schedules the full order lifecycle after placement:
 * confirmed (5s) → preparing (30s) → out_for_delivery (90s, rider moves) → delivered (180s).
 * Location updates are emitted every 8 s while the rider is en route.
 */
const simulateOrderProgress = (orderId, destination) => {
  const origin = { lat: RESTAURANT_LAT, lng: RESTAURANT_LNG };

  setTimeout(() => emitStatusUpdate(orderId, "confirmed"), 5_000);

  setTimeout(() => emitStatusUpdate(orderId, "preparing"), 30_000);

  setTimeout(() => {
    emitStatusUpdate(orderId, "out_for_delivery", origin);

    const STEPS = 10;
    for (let step = 1; step <= STEPS; step++) {
      setTimeout(() => {
        const t = step / STEPS;
        const io = getIO();
        if (!io) return;
        io.to(`order_${orderId}`).emit("order_update", {
          status: "out_for_delivery",
          riderLocation: {
            lat: origin.lat + (destination.lat - origin.lat) * t,
            lng: origin.lng + (destination.lng - origin.lng) * t,
          },
          timestamp: new Date().toISOString(),
        });
      }, step * 8_000);
    }
  }, 90_000);

  setTimeout(() => emitStatusUpdate(orderId, "delivered", destination), 180_000);
};

/**
 * Called once on server startup. Any non-delivered order older than the full
 * simulation window must have had its setTimeout chain killed by a server
 * restart — mark those as delivered so they don't show as "In Progress" forever.
 */
export const reconcileStaleOrders = async () => {
  const cutoff = new Date(Date.now() - SIMULATION_DURATION_MS);
  await OrderModel.updateMany(
    { status: { $ne: "delivered" }, createdAt: { $lt: cutoff } },
    { $set: { status: "delivered" } }
  );
};

// Creates a new order document for the authenticated user and stores it in
// the database as a permanent snapshot of what was ordered, where, and for how much.
// After saving, kicks off the background status simulation.
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

    const deliveryDestination = getDeliveryDestination(orderId);

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
      deliveryDestination,
    });

    const savedOrder = await order.save();

    simulateOrderProgress(orderId, deliveryDestination);

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

// Returns a single order by orderId, only if it belongs to the authenticated user.
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await OrderModel.findOne({ orderId, userId });
    if (!order) {
      return res.status(404).json({ code: 404, message: "Order not found" });
    }

    return res.json({
      code: 200,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Internal server error. Please try again later.",
      errormessage: error.message,
    });
  }
};
