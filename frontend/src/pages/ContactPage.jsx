import React from "react";
import "../styles/About-Contact.scss";

const ContactPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Contact Us</h1>
        <p>We’d love to hear from you!</p>
      </div>

      <img
        className="page-image"
        src="https://images.unsplash.com/photo-1600891963939-90e8f1a9bca3"
        alt="Contact FoodRexpress"
      />

      <div className="page-content">
        <p>
          Have a question, feedback, or suggestion? Our team at{" "}
          <strong>FoodRexpress</strong> is always here to help you. Get in touch
          with us through the details below or drop by our office for a cup of
          chai ☕.
        </p>

        <div className="contact-info">
          <h2>Reach Us</h2>
          <p>
            📍 <strong>Address:</strong> 123 Food Street, Andheri West, Mumbai,
            Maharashtra - 400053
          </p>
          <p>
            📞 <strong>Phone:</strong>{" "}
            <a href="tel:+919876543210">+91 98765 43210</a>
          </p>
          <p>
            ✉️ <strong>Email:</strong>{" "}
            <a href="mailto:support@foodrexpress.com">
              support@foodrexpress.com
            </a>
          </p>
          <p>
            🕓 <strong>Working Hours:</strong> Mon - Sun, 9:00 AM to 11:00 PM
          </p>
        </div>

        <div className="page-map" style={{ marginTop: "25px" }}>
          <iframe
            title="FoodRexpress Office"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.582965553088!2d72.8413!3d19.1123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b7b1f4b06f47%3A0xe2c24611c84b4e0a!2sAndheri%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1714132535481!5m2!1sen!2sin"
            width="100%"
            height="350"
            style={{
              border: 0,
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
