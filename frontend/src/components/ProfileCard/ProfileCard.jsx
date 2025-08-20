import React, { useRef, useState } from "react";
import "./ProfileCard.scss";

export const ProfileCard = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Call API to save profile
    console.log("Updated user:", formData);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
    }
  };

  return (
    <div className="profile-card">
      <img
        src={formData.avatar || "avatar.png"}
        alt="Profile Avatar"
        className="profile-avatar"
        onClick={handleAvatarClick}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleAvatarChange}
      />

      {!isEditing ? (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p>Phone: {user.phone || "Not added"}</p>
          <p>Address: {user.address || "Not added"}</p>
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </>
      ) : (
        <div className="edit-form">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="Phone Number"
          />
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            placeholder="Address"
          />

          <div className="form-actions">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
