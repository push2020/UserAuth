import { useEffect, useRef, useState } from "react";
import { io as socketIO } from "socket.io-client";
import AppConstants from "../constants/AppConstants.js";

/**
 * Connects to the Socket.IO server, joins the room for the given orderId,
 * and listens for order_update events. Returns the latest status and
 * riderLocation so the caller can reactively update the UI.
 *
 * @param {string} orderId - The order's string ID (e.g. "FE-A1B2C3").
 * @param {string} token   - The user's JWT for socket auth.
 * @returns {{ status: string|null, riderLocation: {lat:number,lng:number}|null, isConnected: boolean }}
 */
const useOrderTracking = (orderId, token) => {
  const [status, setStatus] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId || !token) return undefined;

    const socketUrl = AppConstants.Socket_Url;
    const socket = socketIO(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_order", orderId);
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("order_update", (payload) => {
      if (payload.status) setStatus(payload.status);
      if (payload.riderLocation) setRiderLocation(payload.riderLocation);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, token]);

  return { status, riderLocation, isConnected };
};

export default useOrderTracking;
