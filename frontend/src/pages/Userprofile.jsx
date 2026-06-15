import { useEffect } from "react";
import { ProfileCard } from "../components/ProfileCard/ProfileCard";
import { useAuth } from "../context/AuthContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import "../styles/UserProfile.scss";

// Profile route. Wraps the editable ProfileCard with a cinematic banner.
// Gated state opens the AuthModal rather than redirecting, preserving the URL.
export const UserProfile = () => {
  const { user } = useAuth();
  const { openModal } = useModal();

  // Reveals scroll-targeted elements once they enter the viewport.
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [user]);

  if (!user) {
    return (
      <div className="profile-page">
        <ProfileBanner subtitle="Sign in to manage your details" title="My profile" />
        <div className="profile-gated" data-reveal>
          <h2>Sign in to view your profile</h2>
          <p>You&apos;ll be able to update your name, contact info, and avatar.</p>
          <button type="button" className="primary-btn" onClick={openModal}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <ProfileBanner subtitle="Manage your account" title="My profile" />
      <div className="profile-body" data-reveal>
        <ProfileCard user={user} />
      </div>
    </div>
  );
};

// Dark gradient banner that opens the Profile route.
const ProfileBanner = ({ title, subtitle }) => (
  <section className="profile-banner">
    <div className="profile-banner-bg" aria-hidden="true">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
    </div>
    <div className="profile-banner-inner">
      <p className="profile-eyebrow">
        <span className="dot" />
        {subtitle}
      </p>
      <h1>{title}</h1>
    </div>
  </section>
);
