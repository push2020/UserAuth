import { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "../services/apiservice";
import AppConstants from "../constants/AppConstants";

const LocationContext = createContext();

const STORAGE_KEY = "deliveryLocation";
const ASKED_KEY = "locationAsked";

// Calls the Nominatim reverse-geocoding API and returns a short, readable
// address string built from the road, suburb, and city fields of the response.
// Expects numeric latitude and longitude values.
// Returns a plain string on success, or null if the request fails.
// eslint-disable-next-line react-refresh/only-export-components
export const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const { road, suburb, neighbourhood, city, town, county, state } =
      data.address ?? {};
    const area = road || suburb || neighbourhood || "";
    const locality = city || town || county || "";
    const parts = [area, locality, state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : data.display_name ?? null;
  } catch {
    return null;
  }
};

// Manages the user's saved delivery location and the visibility of the
// LocationModal. Persists the location to localStorage between sessions.
// When a logged-in user saves a location it is also written to their profile.
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loads any previously saved location from localStorage on mount,
  // and auto-opens the modal on the very first visit (before any location is set).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLocation(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    const alreadyAsked = localStorage.getItem(ASKED_KEY);
    if (!alreadyAsked) {
      const id = window.setTimeout(() => setIsModalOpen(true), 1200);
      return () => window.clearTimeout(id);
    }

    return undefined;
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    localStorage.setItem(ASKED_KEY, "true");
    setIsModalOpen(false);
  };

  // Persists the location object to state + localStorage and, if a logged-in
  // user is available, also saves the address to their profile.
  // Expects an object with { address, lat, lng, source } and an optional user object.
  const saveLocation = (loc, user) => {
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    localStorage.setItem(ASKED_KEY, "true");

    if (user?._id && loc.address) {
      const payload = new FormData();
      payload.append("address", loc.address);
      const url = AppConstants.Api_Domain + `api/user/update/${user._id}`;
      const headers = { authorization: AppConstants.Auth_Token };
      apiService.putRequest(url, headers, payload, () => {}, () => {});
    }
  };

  // Removes the saved location from state and localStorage.
  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <LocationContext.Provider
      value={{ location, isModalOpen, openModal, closeModal, saveLocation, clearLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};

// Returns the LocationContext value. Must be called inside a LocationProvider.
// eslint-disable-next-line react-refresh/only-export-components
export const useLocation = () => useContext(LocationContext);
