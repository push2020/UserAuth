import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/TrackOrder.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import useOrderTracking from "../hooks/useOrderTracking.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const RESTAURANT_LOCATION = { lat: 18.5204, lng: 73.8567 };

const STATUS_STEPS = [
  { key: "confirmed", label: "Order Confirmed", icon: "✓" },
  { key: "preparing", label: "Preparing Your Food", icon: "🍳" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

const STATUS_ORDER = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

// ── Leaflet icon helpers ───────────────────────────────────────────────────────

/** Creates a lightweight emoji DivIcon for Leaflet markers. */
const emojiIcon = (emoji) =>
  L.divIcon({
    html: `<span role="img" aria-label="${emoji}" class="map-emoji-icon">${emoji}</span>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const restaurantIcon = emojiIcon("🍽️");
const destinationIcon = emojiIcon("📍");
const riderIcon = emojiIcon("🛵");

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Fits the map to keep restaurant, destination, and rider all in view. */
const MapFitBounds = ({ restaurant, destination, rider }) => {
  const map = useMap();
  useEffect(() => {
    const points = [
      [restaurant.lat, restaurant.lng],
      [destination.lat, destination.lng],
    ];
    if (rider) points.push([rider.lat, rider.lng]);
    map.fitBounds(points, { padding: [48, 48], animate: true, maxZoom: 15 });
  }, [map, restaurant, destination, rider]);
  return null;
};

/** Vertical stepper showing the four tracking stages. */
const StatusStepper = ({ currentStatus }) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus ?? "placed");

  return (
    <ol className="status-stepper" aria-label="Order status">
      {STATUS_STEPS.map((step) => {
        const stepIndex = STATUS_ORDER.indexOf(step.key);
        const isDone = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;

        return (
          <li
            key={step.key}
            className={`stepper-step${isDone ? " is-done" : ""}${isActive ? " is-active" : ""}`}
          >
            <span className="stepper-icon" aria-hidden="true">
              {isDone ? "✓" : step.icon}
            </span>
            <span className="stepper-label">{step.label}</span>
            {isActive && <span className="stepper-pulse" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Real-time order tracking page. Fetches initial order data via REST on mount,
 * then subscribes to live updates through Socket.IO. Renders a Leaflet map
 * with restaurant, rider, and destination markers plus a status timeline.
 */
export const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const token = AppConstants.Auth_Token;
  const { status: liveStatus, riderLocation, isConnected } = useOrderTracking(orderId, token);

  // Derive the displayed status: prefer live socket updates, fall back to DB value.
  const displayStatus = liveStatus ?? order?.status ?? "placed";

  // Fetch initial order snapshot so we can show current state on page load.
  useEffect(() => {
    if (!orderId) return;
    if (!token) { navigate("/", { replace: true }); return; }

    apiService.getRequest(
      `${AppConstants.Api_Domain}api/orders/${orderId}`,
      { authorization: token },
      (res) => {
        setOrder(res.data);
        setIsLoading(false);
      },
      () => {
        setFetchError(true);
        setIsLoading(false);
      }
    );
  }, [orderId, token, navigate]);

  if (isLoading) {
    return (
      <div className="track-page track-page--loading">
        <div className="track-spinner" aria-label="Loading order…" />
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="track-page track-page--error">
        <p>Could not load order. <Link to="/dashboard">Back to orders</Link></p>
      </div>
    );
  }

  const destination = order.deliveryDestination ?? RESTAURANT_LOCATION;
  const mapCenter = [RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng];

  const isDelivering = displayStatus === "out_for_delivery" || displayStatus === "delivered";

  // Traveled segment: restaurant → rider (solid). Only when rider is live.
  const routeTraveled = riderLocation
    ? [[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], [riderLocation.lat, riderLocation.lng]]
    : null;

  // Remaining segment: rider → destination (dashed). Falls back to full route before rider appears.
  const routeRemaining = riderLocation
    ? [[riderLocation.lat, riderLocation.lng], [destination.lat, destination.lng]]
    : [[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], [destination.lat, destination.lng]];

  return (
    <div className="track-page">
      <header className="track-header">
        <Link to="/dashboard" className="track-back">
          <BackIcon /> Orders
        </Link>
        <div className="track-header-info">
          <span className="track-order-id">{order.orderId}</span>
          <span className="track-eta">
            {order.estimatedMinutes} min estimated
          </span>
        </div>
        {isConnected && (
          <span className="track-live-badge" aria-label="Live tracking active">LIVE</span>
        )}
      </header>

      {/* Map */}
      <div className="track-map-wrap">
        <MapContainer
          center={mapCenter}
          zoom={14}
          className="track-map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Restaurant marker */}
          <Marker
            position={[RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng]}
            icon={restaurantIcon}
          />

          {/* Delivery destination marker */}
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />

          {/* Traveled segment: restaurant → rider (solid orange) */}
          {isDelivering && routeTraveled && (
            <Polyline
              positions={routeTraveled}
              pathOptions={{ color: "#ff6b35", weight: 4, opacity: 1 }}
            />
          )}

          {/* Remaining segment: rider → destination (dashed, faded) */}
          {isDelivering && (
            <Polyline
              positions={routeRemaining}
              pathOptions={{ color: "#ff6b35", weight: 3, opacity: 0.35, dashArray: "6 5" }}
            />
          )}

          {/* Rider marker — only visible once out for delivery */}
          {riderLocation && (
            <Marker
              position={[riderLocation.lat, riderLocation.lng]}
              icon={riderIcon}
            />
          )}

          {/* Keep restaurant, rider, and destination all in view */}
          <MapFitBounds
            restaurant={RESTAURANT_LOCATION}
            destination={destination}
            rider={riderLocation}
          />
        </MapContainer>
      </div>

      {/* Status timeline */}
      <div className="track-body">
        <div className="track-address">
          <span className="track-address-label">Delivering to</span>
          <span className="track-address-value">{order.address}</span>
        </div>
        <StatusStepper currentStatus={displayStatus} />
      </div>
    </div>
  );
};
