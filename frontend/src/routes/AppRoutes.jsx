import React from "react";
import { Route, Routes } from "react-router-dom";
import { Home } from "../pages/Home";
import { UserProfile } from "../pages/Userprofile";
import { Dashboard } from "../pages/Dashboard";
import { Setting } from "../pages/Setting";
import { NotFound } from "../pages/NotFound";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="user/:id" element={<UserProfile />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="settings" element={<Setting />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
