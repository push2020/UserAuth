import { useEffect, useState } from "react";
import "../styles/Menu.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import Loader from "../components/Loader/Loader.jsx";

// Derives the cart-line itemId for an (category, name) pair. Must stay in sync with the backend rule.
const generateItemId = (category, itemName) =>
  `${category}_${itemName}`.replace(/\s+/g, "_").toLowerCase();

// Tells whether the user has requested reduced motion via OS settings.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Minus glyph for the quantity stepper decrement button.
const MinusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
  </svg>
);

// Plus glyph used by the Add button and the stepper increment button.
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Quantity stepper for a menu item. Renders a single "Add" CTA when count is 0,
// otherwise a three-segment [−][count][+] control. Accepts the current count and
// two callbacks; emits no count itself.
const QuantityControl = ({ count, onAdd, onSubtract, itemName }) => {
  if (count === 0) {
    return (
      <button type="button" className="add-btn" onClick={onAdd}>
        <PlusIcon />
        <span>Add</span>
      </button>
    );
  }

  return (
    <div className="qty-stepper" role="group" aria-label={`Quantity for ${itemName}`}>
      <button
        type="button"
        className="qty-btn"
        onClick={onSubtract}
        aria-label={`Decrease ${itemName} quantity`}
      >
        <MinusIcon />
      </button>
      <span className="qty-value" aria-live="polite">
        {count}
      </span>
      <button
        type="button"
        className="qty-btn"
        onClick={onAdd}
        aria-label={`Increase ${itemName} quantity`}
      >
        <PlusIcon />
      </button>
    </div>
  );
};

// A single menu item tile. Renders image, veg/non-veg chip, name, price, and quantity control.
const MenuItemCard = ({ item, defaultImage, count, onAdd, onSubtract }) => {
  // Handles a broken image URL by swapping in the menu-wide default image.
  const handleImageError = (event) => {
    if (event.target.src !== defaultImage) {
      event.target.src = defaultImage;
    }
  };

  return (
    <article className="menu-item" data-reveal>
      <div className="menu-item-image">
        <img
          src={item.image || defaultImage}
          alt={item.name}
          loading="lazy"
          onError={handleImageError}
        />
        <span
          className={`veg-chip ${item.isVeg ? "is-veg" : "is-non-veg"}`}
          aria-label={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
        >
          <span className="veg-square" aria-hidden="true">
            <span className="veg-dot" />
          </span>
          {item.isVeg ? "Veg" : "Non-Veg"}
        </span>
      </div>
      <div className="menu-item-body">
        <h3>{item.name}</h3>
        <div className="menu-item-footer">
          <span className="price">₹{item.price}</span>
          <QuantityControl
            count={count}
            onAdd={onAdd}
            onSubtract={onSubtract}
            itemName={item.name}
          />
        </div>
      </div>
    </article>
  );
};

// Menu page: cinematic dark hero followed by category sections of item cards.
// Requires an authenticated user; otherwise renders an in-page sign-in prompt.
export const Menu = () => {
  const [menu, setMenu] = useState(null);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { openModal } = useModal();

  // Fetches the menu once a signed-in user is available.
  useEffect(() => {
    if (!user) return;
    const url = AppConstants.Api_Domain + "menu";
    const headers = { authorization: AppConstants.Auth_Token };
    apiService.getRequest(
      url,
      headers,
      (res) => {
        if (res) setMenu(res.data);
      },
      () => {
        setHasError(true);
      }
    );
  }, [user]);

  // Reveals scroll-targeted elements once they enter the viewport.
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [menu]);

  // Looks up the cart quantity for a given (category, item) pair. Returns 0 if not in cart.
  const getItemQuantity = (category, item) => {
    if (!cart || !cart.items) return 0;
    const itemId = generateItemId(category, item.name);
    const cartItem = cart.items.find((entry) => entry.itemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Increments quantity by 1 — adds the item if it's not yet in the cart.
  const handleAdd = (item, categoryName) => {
    const itemId = generateItemId(categoryName, item.name);
    const currentQuantity = getItemQuantity(categoryName, item);

    // Strip server-managed _id before sending the payload; never mutates the caller's object.
    const { _id, ...itemPayload } = item;
    void _id;

    if (currentQuantity === 0) {
      addToCart(itemPayload, categoryName, 1);
    } else {
      updateQuantity(itemId, currentQuantity + 1);
    }
  };

  // Decrements quantity by 1 — removes the line entirely when it hits 0.
  const handleSubtract = (item, categoryName) => {
    const itemId = generateItemId(categoryName, item.name);
    const currentQuantity = getItemQuantity(categoryName, item);

    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      removeFromCart(itemId);
    }
  };

  if (user === undefined) {
    return (
      <div className="menu-state-wrap">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="menu-page">
        <MenuHero />
        <div className="menu-gated">
          <h2>Sign in to view the menu</h2>
          <p>Create an account or sign in to browse dishes and place an order.</p>
          <button type="button" className="primary-btn" onClick={openModal}>
            Sign in
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="menu-page">
        <MenuHero />
        <div className="menu-error">
          <h2>We couldn&apos;t load the menu</h2>
          <p>Something went wrong fetching today&apos;s dishes.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setHasError(false);
              setMenu(null);
            }}
          >
            Try again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="menu-state-wrap">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="menu-page">
        <MenuHero />

        {menu.categories?.length === 0 ? (
          <div className="menu-empty">
            <h2>Menu is being prepared</h2>
            <p>Check back soon — fresh dishes are on the way.</p>
          </div>
        ) : (
          menu.categories?.map((category) => (
            <section className="menu-category" key={category.name}>
              <header className="category-header" data-reveal>
                <p className="category-eyebrow">Category</p>
                <h2>{category.name}</h2>
              </header>
              <div className="menu-items">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={`${category.name}-${item.name}`}
                    item={item}
                    defaultImage={menu.defaultImage}
                    count={getItemQuantity(category.name, item)}
                    onAdd={() => handleAdd(item, category.name)}
                    onSubtract={() => handleSubtract(item, category.name)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <Footer />
    </>
  );
};

// Dark cinematic banner shown at the top of the Menu page in every state.
// Pure presentation — no props.
const MenuHero = () => (
  <section className="menu-hero">
    <div className="menu-hero-bg" aria-hidden="true">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="grid" />
    </div>
    <div className="menu-hero-inner">
      <p className="menu-hero-eyebrow">
        <span className="dot" />
        Today&apos;s menu
      </p>
      <h1>Explore the menu</h1>
      <p className="menu-hero-sub">
        Curated dishes from kitchens around you, ready to deliver in minutes.
      </p>
    </div>
  </section>
);
