import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/About-Contact.scss";

const VALUES = [
  {
    title: "Fast delivery",
    desc: "Hot meals to your door in under 30 minutes on average.",
  },
  {
    title: "Curated kitchens",
    desc: "Every partner is vetted for quality, hygiene, and consistency.",
  },
  {
    title: "Transparent prices",
    desc: "What you see is what you pay — no hidden fees, ever.",
  },
];

// About page. Pure marketing copy, no API calls. Adds scroll-reveal for parity
// with the rest of the app.
export default function AboutPage() {
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
            Our story
          </p>
          <h1>About FoodExpress</h1>
          <p className="info-sub">
            Fast, fresh, and delivered with care — built for people who don&apos;t
            want to compromise on either.
          </p>
        </div>
      </section>

      <section className="info-section" data-reveal>
        <div className="info-card info-card-feature">
          <img
            src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=70"
            alt="A spread of freshly prepared dishes"
            loading="lazy"
          />
          <div className="info-card-body">
            <h2>Made with love, delivered with speed</h2>
            <p>
              FoodExpress is your one-stop destination for fast, delicious, and
              freshly prepared food delivered right to your doorstep. Whether
              it&apos;s a spicy biryani, a cheesy pizza, or a refreshing
              beverage, we make sure every meal is made with love.
            </p>
            <Link to="/menu" className="info-cta">
              Browse the menu
            </Link>
          </div>
        </div>
      </section>

      <section className="info-section" data-reveal>
        <h2 className="info-section-title">What we stand for</h2>
        <div className="values-grid">
          {VALUES.map((value, idx) => (
            <article
              className="value-card"
              key={value.title}
              data-reveal
              style={{ "--reveal-delay": `${idx * 80}ms` }}
            >
              <span className="value-index">0{idx + 1}</span>
              <h3>{value.title}</h3>
              <p>{value.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
