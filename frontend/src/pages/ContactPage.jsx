import { useEffect } from "react";
import "../styles/About-Contact.scss";

// Map-pin glyph for the address row.
const PinIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Handset glyph for the phone row.
const PhoneIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// Envelope glyph for the email row.
const MailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

// Clock glyph for the working-hours row.
const ClockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CONTACT_ROWS = [
  {
    icon: <PinIcon />,
    label: "Address",
    value: "123 Food Street, Andheri West, Mumbai, Maharashtra — 400053",
  },
  {
    icon: <PhoneIcon />,
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: <MailIcon />,
    label: "Email",
    value: "support@foodexpress.com",
    href: "mailto:support@foodexpress.com",
  },
  {
    icon: <ClockIcon />,
    label: "Working hours",
    value: "Monday – Sunday, 9:00 AM to 11:00 PM",
  },
];

// Contact page. Static content; an embedded map and a list of contact rows.
const ContactPage = () => {
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
  }, []);

  return (
    <div className="info-page">
      <section className="info-hero">
        <div className="info-hero-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
        </div>
        <div className="info-hero-inner">
          <p className="info-eyebrow">
            <span className="dot" />
            Talk to us
          </p>
          <h1>Get in touch</h1>
          <p className="info-sub">
            Question, feedback, or just want to say hi? We&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="info-section" data-reveal>
        <div className="contact-grid">
          <div className="contact-card">
            <h2>Reach us</h2>
            <ul className="contact-list">
              {CONTACT_ROWS.map((row) => (
                <li key={row.label}>
                  <span className="row-icon" aria-hidden="true">
                    {row.icon}
                  </span>
                  <div className="row-text">
                    <span className="row-label">{row.label}</span>
                    {row.href ? (
                      <a href={row.href} className="row-value">
                        {row.value}
                      </a>
                    ) : (
                      <span className="row-value">{row.value}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="contact-map">
            <iframe
              title="FoodExpress office map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.582965553088!2d72.8413!3d19.1123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7b1f4b06f47%3A0xe2c24611c84b4e0a!2sAndheri%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1714132535481!5m2!1sen!2sin"
              width="100%"
              height="100%"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
