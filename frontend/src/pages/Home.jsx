import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Footer } from "../components/Footer/Footer.jsx";
import { apiService } from "../services/apiservice.js";
import AppConstants from "../constants/AppConstants.js";
import { cloudinaryAssets } from "../constants/cloudinaryAssets.js";
import "../styles/Home.scss";

const HERO_HEADING_WORDS = [
  "Delicious",
  "food,",
  "delivered",
  "to",
  "your",
  "door.",
];

const MARQUEE_TAGS = [
  "Pizza",
  "Burgers",
  "Pasta",
  "Sushi",
  "Tacos",
  "Desserts",
  "Salads",
  "Biryani",
  "Noodles",
  "Coffee",
];

const STATS = [
  { value: 30, suffix: "min", label: "Average delivery" },
  { value: 10, suffix: "K+", label: "Orders served" },
  { value: 500, suffix: "+", label: "Partner kitchens" },
  { value: 4.9, suffix: "★", label: "Customer rating", decimals: 1 },
];

const STEPS = [
  {
    title: "Browse the menu",
    desc: "Explore curated dishes from kitchens around you.",
  },
  {
    title: "Place your order",
    desc: "Secure checkout in under a minute.",
  },
  {
    title: "Get it delivered",
    desc: "Track your rider in real time, door-to-door.",
  },
];

const ARROW_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// Tells whether the user has requested reduced motion via OS settings.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animated number that counts from 0 up to the target value once it scrolls into view.
// Expects a numeric value, an optional suffix string, a label string, and an optional decimals count.
// Returns a single .stat element ready to drop inside the stats grid.
const Stat = ({ value, suffix, label, decimals = 0 }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (prefersReducedMotion()) {
      setDisplay(value);
      return undefined;
    }

    let raf;
    let startTime;
    const duration = 1500;

    // Steps the count value forward with an ease-out cubic curve until it reaches the target.
    const animate = (now) => {
      if (startTime === undefined) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Number((value * eased).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          raf = requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, decimals]);

  return (
    <div className="stat" ref={ref}>
      <strong>
        {decimals > 0 ? display.toFixed(decimals) : display}
        <em>{suffix}</em>
      </strong>
      <span>{label}</span>
    </div>
  );
};

// Home page composed of: cinematic hero, marquee, stats, popular categories,
// "how it works" steps, and a mouse-spotlit CTA. Pulls the popular dishes list
// from /api/begin and gracefully degrades when the call fails.
export const Home = () => {
  const [homeState, setHomeState] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroImageRef = useRef(null);
  const ctaRef = useRef(null);

  // Fetches the popular-dishes list from the backend on mount.
  useEffect(() => {
    const url = AppConstants.Api_Domain + "api/begin";
    apiService.getRequest(
      url,
      {},
      (res) => {
        if (res) setHomeState(res.data);
      },
      () => {
        // Silently fall back to an empty list; the section hides when empty per spec.
        setHomeState({ popularDishes: [] });
      }
    );
  }, []);

  // Tracks vertical scroll position so the top progress bar can scale to it.
  useEffect(() => {
    // Recomputes the current scroll percentage and pushes it to state.
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Adds the .is-visible class to any element with data-reveal once it scrolls into view.
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    if (prefersReducedMotion()) {
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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [homeState]);

  // Tilts the hero image based on cursor position to create a depth-of-field feel.
  useEffect(() => {
    const el = heroImageRef.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) return undefined;

    // Maps cursor position to rotateX/rotateY CSS variables on the image.
    const handleMove = (event) => {
      const rect = el.getBoundingClientRect();
      const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
      const yRatio = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", `${yRatio * -8}deg`);
      el.style.setProperty("--tilt-y", `${xRatio * 8}deg`);
    };
    // Resets the tilt to flat when the cursor leaves the image.
    const reset = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  // Drives a radial spotlight on the final CTA section that follows the cursor.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) return undefined;

    // Writes cursor coordinates (relative to the section) to CSS variables.
    const handleMove = (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
      el.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    };

    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, []);

  const hasCategories = homeState?.popularDishes?.length > 0;

  return (
    <>
      <div
        className="scroll-progress"
        style={{ "--progress": scrollProgress }}
        aria-hidden="true"
      />
      <div className="home-container">
        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <span className="orb orb-1" />
            <span className="orb orb-2" />
            <span className="orb orb-3" />
            <span className="grid" />
          </div>

          <div className="hero-text">
            <p className="hero-eyebrow" data-reveal>
              <span className="dot" />
              Now delivering in your city
            </p>
            <h1 className="hero-heading" aria-label={HERO_HEADING_WORDS.join(" ")}>
              {HERO_HEADING_WORDS.map((word, idx) => (
                <span className="word" key={word + idx} aria-hidden="true">
                  {word}
                </span>
              ))}
            </h1>
            <p className="hero-sub" data-reveal>
              Order from your favourite kitchens with lightning-fast delivery
              and live order tracking.
            </p>
            <div className="hero-actions" data-reveal>
              <Link to="/menu" className="hero-btn primary">
                <span>Order now</span>
                {ARROW_ICON}
              </Link>
              <Link to="/about" className="hero-btn ghost">
                Learn more
              </Link>
            </div>
          </div>

          <div className="hero-image-wrap">
            <div className="hero-image" ref={heroImageRef}>
              <img
                src={cloudinaryAssets.heroImage}
                alt="A vibrant plate of food ready for delivery"
              />
              <span className="hero-image-glow" aria-hidden="true" />
            </div>
            <div className="hero-card hero-card-rating" data-reveal>
              <strong>4.9★</strong>
              <span>50K+ reviews</span>
            </div>
            <div className="hero-card hero-card-eta" data-reveal>
              <strong>~28 min</strong>
              <span>Avg ETA</span>
            </div>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, i) => (
              <span className="marquee-item" key={`${tag}-${i}`}>
                {tag}
                <span className="marquee-dot" />
              </span>
            ))}
          </div>
        </div>

        <section className="stats" data-reveal>
          <div className="stats-inner">
            {STATS.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        {hasCategories && (
          <section className="categories">
            <header className="section-header" data-reveal>
              <p className="section-eyebrow">Discover</p>
              <h2>Popular categories</h2>
              <p className="section-sub">
                Trending picks from our most-loved kitchens
              </p>
            </header>
            <div className="category-list">
              {homeState.popularDishes.map(({ key, name, url }) => (
                <Link to="/menu" className="category-card" key={key} data-reveal>
                  <div className="category-card-image">
                    <img src={url} alt={name} loading="lazy" />
                  </div>
                  <div className="category-card-body">
                    <p>{name}</p>
                    <span className="arrow">{ARROW_ICON}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="how-it-works">
          <header className="section-header" data-reveal>
            <p className="section-eyebrow">Process</p>
            <h2>How it works</h2>
            <p className="section-sub">
              From craving to doorstep in three steps
            </p>
          </header>
          <div className="steps">
            <span className="steps-line" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <article className="step" key={step.title} data-reveal>
                <span className="step-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-final" ref={ctaRef}>
          <span className="cta-spotlight" aria-hidden="true" />
          <div className="cta-inner" data-reveal>
            <h2>Hungry? Let&apos;s fix that.</h2>
            <p>Order in minutes. Delivered in record time.</p>
            <Link to="/menu" className="hero-btn primary large">
              <span>Browse the menu</span>
              {ARROW_ICON}
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};
