import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/Menu.scss";
import AppConstants from "../constants/AppConstants.js";
import { apiService } from "../services/apiservice.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { Footer } from "../components/Footer/Footer.jsx";
import { Cart } from "../components/Cart/Cart.jsx";
import Loader from "../components/Loader/Loader.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Derives the cart-line itemId for a (category, name) pair.
const generateItemId = (category, itemName) =>
  `${category}_${itemName}`.replace(/\s+/g, "_").toLowerCase();

// Converts a category name to a safe DOM id fragment.
const slugify = (name) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Returns true when the OS has requested reduced motion.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Icons ─────────────────────────────────────────────────────────────────────

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CartBagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3h2.2l2.2 12.2A2 2 0 0 0 9.4 17h8.4a2 2 0 0 0 1.96-1.6L21 8H6.6" />
    <circle cx="10" cy="20.5" r="1.5" />
    <circle cx="18" cy="20.5" r="1.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

// Three-segment quantity stepper. Renders an "Add" pill at count 0,
// then [−][count][+] once an item is in the cart.
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
      <button type="button" className="qty-btn"
        onClick={onSubtract} aria-label={`Decrease ${itemName} quantity`}>
        <MinusIcon />
      </button>
      <span className="qty-value" aria-live="polite">{count}</span>
      <button type="button" className="qty-btn"
        onClick={onAdd} aria-label={`Increase ${itemName} quantity`}>
        <PlusIcon />
      </button>
    </div>
  );
};

// Single menu item card with image, veg chip, name, price and quantity control.
const MenuItemCard = ({ item, defaultImage, count, onAdd, onSubtract }) => {
  // Falls back to the menu-wide default image if the item image URL is broken.
  const handleImageError = (e) => {
    if (e.target.src !== defaultImage) e.target.src = defaultImage;
  };

  return (
    <article className="menu-item" data-reveal>
      <div className="menu-item-image">
        <img src={item.image || defaultImage} alt={item.name}
          loading="lazy" onError={handleImageError} />
        <span className={`veg-chip ${item.isVeg ? "is-veg" : "is-non-veg"}`}
          aria-label={item.isVeg ? "Vegetarian" : "Non-vegetarian"}>
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
          <QuantityControl count={count} onAdd={onAdd}
            onSubtract={onSubtract} itemName={item.name} />
        </div>
      </div>
    </article>
  );
};

// Dark cinematic hero banner shown in every menu state.
const MenuHero = () => (
  <section className="menu-hero">
    <div className="menu-hero-bg" aria-hidden="true">
      <span className="orb orb-1" /><span className="orb orb-2" />
      <span className="grid" />
    </div>
    <div className="menu-hero-inner">
      <p className="menu-hero-eyebrow"><span className="dot" />Today&apos;s menu</p>
      <h1>Explore the menu</h1>
      <p className="menu-hero-sub">
        Curated dishes from kitchens around you, ready to deliver in minutes.
      </p>
    </div>
  </section>
);

// ── Menu page ─────────────────────────────────────────────────────────────────

// Full menu page. Authenticated users get search/filter, category nav, item grid,
// and a sticky cart summary bar. Unauthenticated users see an in-page sign-in prompt.
export const Menu = () => {
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart, getTotalAmount } = useCart();
  const { openModal } = useModal();

  const [menu, setMenu] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const navRef = useRef(null);
  const searchRef = useRef(null);

  // Fetches the menu once a signed-in user is available.
  useEffect(() => {
    if (!user) return;
    const url = AppConstants.Api_Domain + "menu";
    const headers = { authorization: AppConstants.Auth_Token };
    apiService.getRequest(url, headers,
      (res) => { if (res) setMenu(res.data); },
      () => { setHasError(true); }
    );
  }, [user]);

  // Filters menu categories by the current search query and veg/non-veg toggle.
  // Returns only categories that have at least one matching item.
  const filteredCategories = useMemo(() => {
    if (!menu?.categories) return [];
    const q = searchQuery.trim().toLowerCase();
    return menu.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const matchesSearch = !q || item.name.toLowerCase().includes(q);
          const matchesVeg =
            vegFilter === "all" ||
            (vegFilter === "veg" ? item.isVeg === true : item.isVeg === false);
          return matchesSearch && matchesVeg;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menu, searchQuery, vegFilter]);

  // Re-runs scroll reveal whenever filtered categories or search/filter state changes
  // so newly rendered cards are observed by the IntersectionObserver.
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
  }, [filteredCategories]);

  // Watches category section headings and updates the active nav pill as the user scrolls.
  useEffect(() => {
    const sections = document.querySelectorAll("[data-category-section]");
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.categorySection);
          }
        });
      },
      { rootMargin: "-160px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [filteredCategories]);

  // Keeps the active category pill visible inside the horizontally scrolling nav.
  useEffect(() => {
    if (!navRef.current || !activeCategory) return;
    const btn = navRef.current.querySelector(`[data-nav-cat="${activeCategory}"]`);
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  // Scrolls smoothly to a category section, accounting for the sticky header + controls + nav.
  const scrollToCategory = (categoryName) => {
    const el = document.getElementById(`cat-${slugify(categoryName)}`);
    if (!el) return;
    const OFFSET = 190;
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "instant" : "smooth" });
  };

  // Returns the cart quantity for a given (category, item) pair.
  const getItemQuantity = (category, item) => {
    if (!cart?.items) return 0;
    const cartItem = cart.items.find(
      (entry) => entry.itemId === generateItemId(category, item.name)
    );
    return cartItem ? cartItem.quantity : 0;
  };

  // Adds 1 to the item's cart count, creating the line if it doesn't exist.
  const handleAdd = (item, categoryName) => {
    const itemId = generateItemId(categoryName, item.name);
    const currentQty = getItemQuantity(categoryName, item);
    const { _id, ...payload } = item;
    void _id;
    if (currentQty === 0) {
      addToCart(payload, categoryName, 1);
    } else {
      updateQuantity(itemId, currentQty + 1);
    }
  };

  // Removes 1 from the item's cart count, deleting the line at 0.
  const handleSubtract = (item, categoryName) => {
    const itemId = generateItemId(categoryName, item.name);
    const currentQty = getItemQuantity(categoryName, item);
    if (currentQty > 1) updateQuantity(itemId, currentQty - 1);
    else if (currentQty === 1) removeFromCart(itemId);
  };

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const totalAmount = getTotalAmount?.() ?? 0;
  const hasResults = filteredCategories.length > 0;

  // ── Loading / gated / error states ─────────────────────────────────

  if (user === undefined) {
    return <div className="menu-state-wrap"><Loader /></div>;
  }

  if (!user) {
    return (
      <div className="menu-page">
        <MenuHero />
        <div className="menu-gated">
          <h2>Sign in to view the menu</h2>
          <p>Create an account or sign in to browse dishes and place an order.</p>
          <button type="button" className="primary-btn" onClick={openModal}>Sign in</button>
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
          <button type="button" className="primary-btn"
            onClick={() => { setHasError(false); setMenu(null); }}>
            Try again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!menu) {
    return <div className="menu-state-wrap"><Loader /></div>;
  }

  return (
    <>
      <div className={`menu-page${itemCount > 0 ? " has-cart-bar" : ""}`}>
        <MenuHero />

        {/* ── Search + filter controls ── */}
        <div className="menu-controls">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
            <input
              ref={searchRef}
              type="search"
              className="search-input"
              placeholder="Search dishes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search menu items"
            />
            {searchQuery && (
              <button type="button" className="search-clear"
                onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                aria-label="Clear search">
                <ClearIcon />
              </button>
            )}
          </div>
          <div className="veg-toggle" role="group" aria-label="Dietary filter">
            {["all", "veg", "non-veg"].map((opt) => (
              <button
                key={opt}
                type="button"
                className={`veg-pill${vegFilter === opt ? " is-active" : ""}${opt === "veg" ? " is-veg" : opt === "non-veg" ? " is-non-veg" : ""}`}
                onClick={() => setVegFilter(opt)}
                aria-pressed={vegFilter === opt}
              >
                {opt === "all" ? "All" : opt === "veg" ? "Veg" : "Non-Veg"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category nav ── */}
        {menu.categories?.length > 0 && (
          <nav className="category-nav" ref={navRef} aria-label="Menu categories">
            {menu.categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                data-nav-cat={cat.name}
                className={`cat-pill${activeCategory === cat.name ? " is-active" : ""}`}
                onClick={() => scrollToCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        )}

        {/* ── Menu content ── */}
        {menu.categories?.length === 0 ? (
          <div className="menu-empty">
            <h2>Menu is being prepared</h2>
            <p>Check back soon — fresh dishes are on the way.</p>
          </div>
        ) : !hasResults ? (
          <div className="menu-no-results">
            <p className="no-results-emoji" aria-hidden="true">🔍</p>
            <h3>No dishes found</h3>
            <p>
              {searchQuery
                ? `No results for "${searchQuery}"${vegFilter !== "all" ? ` in ${vegFilter}` : ""}. Try a different search.`
                : `No ${vegFilter} dishes available right now.`}
            </p>
            <button type="button" className="primary-btn"
              onClick={() => { setSearchQuery(""); setVegFilter("all"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              className="menu-category"
              key={category.name}
              id={`cat-${slugify(category.name)}`}
              data-category-section={category.name}
            >
              <header className="category-header" data-reveal>
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

        <Footer />
      </div>

      {/* ── Sticky cart summary bar ── */}
      {itemCount > 0 && (
        <div className="cart-bar" role="complementary" aria-label="Cart summary">
          <button
            type="button"
            className="cart-bar-btn"
            onClick={() => setIsCartOpen(true)}
          >
            <span className="cart-bar-count">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            <span className="cart-bar-divider" aria-hidden="true" />
            <span className="cart-bar-label">
              <CartBagIcon />
              View cart
            </span>
            <span className="cart-bar-total">₹{totalAmount.toFixed(2)}</span>
            <ChevronRightIcon />
          </button>
        </div>
      )}

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
