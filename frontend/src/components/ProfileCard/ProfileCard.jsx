import { useRef, useState } from "react";
import "./ProfileCard.scss";
import AppConstants from "../../constants/AppConstants";
import { apiService } from "../../services/apiservice";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

// Camera glyph indicating the avatar is editable while in edit mode.
const CameraIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// Builds an absolute URL for the user's avatar, handling local previews, full URLs,
// API-relative paths, and the missing-avatar fallback.
const resolveAvatar = (avatar) => {
  if (!avatar) return "/avatar.png";
  if (avatar.startsWith("blob:")) return avatar;
  if (avatar.startsWith("http")) return avatar;
  return (AppConstants.Api_Domain + avatar).replace(/\/\/$/, "/");
};

// Editable profile card. View mode shows the user's details; edit mode opens
// an inline form with an avatar picker and save / cancel actions.
export const ProfileCard = ({ user }) => {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(user);
  const fileInputRef = useRef(null);

  // Updates a single form field from a controlled input change event.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Triggers the hidden file input so the user can pick a new avatar.
  const handleAvatarClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  // Stores the selected avatar file and a local preview URL in form state.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, file, avatar: previewUrl }));
  };

  // Posts the updated profile to the API and hands the result back to AuthContext.
  const handleSave = () => {
    const { _id, name, email, phone, address, file } = formData;
    const payload = new FormData();
    payload.append("name", name ?? "");
    payload.append("email", email ?? "");
    payload.append("phone", phone ?? "");
    payload.append("address", address ?? "");
    if (file) payload.append("avatar", file);

    setIsSaving(true);
    const url = AppConstants.Api_Domain + `api/user/update/${_id}`;
    const headers = { authorization: AppConstants.Auth_Token };

    apiService.putRequest(
      url,
      headers,
      payload,
      (res) => {
        updateUser(res.data);
        setIsEditing(false);
        setIsSaving(false);
        showToast({
          title: "Profile updated",
          body: "Your details have been saved.",
        });
      },
      (error) => {
        setIsSaving(false);
        showToast({
          title: "Update failed",
          body: error?.message || "Couldn't save your changes.",
          type: "error",
        });
      }
    );
  };

  // Discards any in-progress edits and returns to view mode.
  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  return (
    <article className="profile-card">
      <div className="profile-card-avatar-wrap">
        <button
          type="button"
          className={`avatar-button${isEditing ? " is-editable" : ""}`}
          onClick={handleAvatarClick}
          aria-label={isEditing ? "Change avatar" : "Profile avatar"}
          disabled={!isEditing}
        >
          <img src={resolveAvatar(formData.avatar)} alt="" />
          {isEditing && (
            <span className="avatar-edit-overlay" aria-hidden="true">
              <CameraIcon />
            </span>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden-file-input"
          accept="image/*"
          onChange={handleAvatarChange}
        />
      </div>

      {!isEditing ? (
        <>
          <header className="profile-card-header">
            <h2>{user.name || "Member"}</h2>
            <p className="profile-card-email">{user.email}</p>
          </header>

          <dl className="profile-fields">
            <div className="field-row">
              <dt>Phone</dt>
              <dd className={user.phone ? "" : "is-empty"}>
                {user.phone || "Not added"}
              </dd>
            </div>
            <div className="field-row">
              <dt>Address</dt>
              <dd className={user.address ? "" : "is-empty"}>
                {user.address || "Not added"}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            className="edit-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit profile
          </button>
        </>
      ) : (
        <form
          className="edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="profile-phone">Phone</label>
            <input
              id="profile-phone"
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="field">
            <label htmlFor="profile-address">Address</label>
            <input
              id="profile-address"
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              placeholder="House, street, city"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? <span className="spinner" aria-hidden="true" /> : "Save"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
};
