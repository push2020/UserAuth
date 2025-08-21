import React from "react";
import { ProfileCard } from "../components/ProfileCard/ProfileCard";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/UserProfile.scss";

export const UserProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <p className="profile-notfound text-center mt-10">
        Please login to view your profile.
      </p>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-title">My profile</div>
      <ProfileCard user={user} />
    </div>
  );
};
