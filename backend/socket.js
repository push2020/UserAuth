import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import UserModel from "./Models/user.js";
import OrderModel from "./Models/order.js";

let io = null;

/**
 * Initialises Socket.IO on the given http.Server, wires up JWT auth middleware,
 * and registers the join_order room handler. Returns the io instance.
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Verify JWT on every incoming socket connection.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded._id).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Client requests to subscribe to updates for a specific order.
    socket.on("join_order", async (orderId) => {
      try {
        const order = await OrderModel.findOne({
          orderId,
          userId: socket.userId,
        });
        if (order) {
          socket.join(`order_${orderId}`);
        }
      } catch {
        // Ignore — invalid join attempts are silently dropped.
      }
    });
  });

  return io;
};

/** Returns the active io instance (null before initSocket is called). */
export const getIO = () => io;
