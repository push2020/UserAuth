# FoodExpress — Product Specs

Specs for the FoodExpress food delivery web app. Authored against the UI/UX best practices in [jiomedia-dev-skills/rules/frontend-web/ui-ux-best-practices.md](../../jiomedia-dev-skills/rules/frontend-web/ui-ux-best-practices.md). Per [spec-is-truth.md](../../jiomedia-dev-skills/rules/common/spec-is-truth.md), this document is the source of truth — code must trace back to it.

---

## 1. Product Overview

FoodExpress is a full-stack food ordering app. Authenticated users browse a categorised menu, add items to a server-persisted cart, and manage a personal profile (avatar, name, email, phone, address). Public pages (Home, About, Contact) introduce the brand.

**Stack:** React + Vite + SCSS frontend; Node.js + Express + MongoDB backend; JWT auth; Cloudinary for media.

---

## 2. Cross-Cutting Rules

These rules apply to every screen and component. They derive from the referenced UI/UX best practices file.

### 2.1 Display Safety

- Every user-facing string sourced from the API (`user.name`, `menu.item.name`, `cart.item.name`, `category.name`) must go through a shared display utility — never rendered raw.
- A `frontend/src/lib/display.js` module must export:
  - `displayName(user, currentUserId)` → returns `"You"` when `user.id === currentUserId`, the trimmed name when present, otherwise `"Member"`.
  - `formatCurrency(amount, currency = "INR")` → handles `NaN`, `null`, and `undefined`; defaults to `"₹0"`; uses `Intl.NumberFormat`.
  - `formatDate(date, format = "short")` → handles invalid dates; returns `"—"` fallback.
- Ad-hoc formatting (e.g. `₹${price}` template literals, `new Date(x).toLocaleString()`) is forbidden inside components. All formatting routes through the utility.

### 2.2 Icons and Visual Elements

- All interactive UI icons (cart, profile menu, +/-, remove, edit, close modal, navigation) must be SVG from a single icon set — Lucide is the chosen library. The current `utils/iconSvg.jsx` is the central registry; do not introduce inline SVGs in feature components.
- Emoji is permitted **only** as decorative content (e.g., the empty-cart illustration). It is forbidden for any functional control.

### 2.3 Layout and Positioning

- Fixed/sticky elements (Header, Cart drawer, Toast container, AuthModal) must respect the app's max-width container. None may use raw `fixed right-4` / `fixed bottom-4`-style escapes.
- Header is `position: sticky; top: 0` within the centered container.
- Cart drawer overlays from the right but is bounded to the container width on screens ≥ 1280 px.
- Toast container is centered horizontally inside the container, anchored to the top.
- Input prefix/suffix slots (e.g., search icon, password show/hide) must size based on slot content — no hardcoded padding constants.

### 2.4 Conditional Rendering

- Every button that depends on data state must be conditionally rendered or disabled with a tooltip explaining why.
  - "Add to Cart" is disabled (with tooltip "Sign in to order") when the user is not authenticated.
  - "Proceed to Checkout" is disabled when `cart.items.length === 0`.
  - "Save Profile" is disabled while a save is in flight.
- Every list view must define an explicit empty state (see §2.5).
- Every async operation must show a loading affordance after 200 ms (not before, to avoid flicker on fast networks).
- Every API call must define an error state with a retry action.

### 2.5 State Coverage Matrix

Every screen below must specify each of these six states. Implementations that ship without all six fail review.

| State | Requirement |
|-------|-------------|
| Default | Normal data loaded — primary content visible |
| Empty | No data — show helpful message + primary action |
| Loading | Skeleton or spinner shown after 200 ms |
| Error | Clear human-readable message + retry button |
| Null fields | Show fallback (`"Not added"`, `"—"`, `"Member"`); never blank |
| Unauthenticated | Show in-page prompt with "Sign in" CTA that opens AuthModal |

---

## 3. Feature Specs

### 3.1 Authentication (Sign Up / Sign In)

**Surface:** `AuthModal` overlay, opened from Header "Sign In" button or any gated action.

**Goal:** Let a visitor create an account or sign back in so they can order.

**Inputs**

| Field | Sign Up | Sign In | Validation |
|-------|---------|---------|------------|
| Full Name | required | — | 2–50 chars; letters and spaces only (`/^[a-zA-Z\s]+$/`) |
| Email | required | required | RFC-like regex; trimmed; lowercased on submit |
| Password | required | required | Min 8 chars; ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit, ≥ 1 special |

> **Note:** Backend currently accepts a 6-char minimum password. Backend must be tightened to match the 8-char rule above before this spec ships. Until then, the frontend enforces the stricter rule and rejects locally.

**Actions**

- Submit (primary, full-width)
- Toggle between Sign Up / Sign In (link, not button)
- Close modal (X icon, top-right; also Esc key; also click outside)

**Backend**

- `POST /auth/signup` → `{ token, user }`
- `POST /auth/login` → `{ token, user }`
- On success: store JWT in `localStorage.authToken`, hydrate `AuthContext`, fire success toast, close modal.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Empty form, primary CTA enabled when all fields valid |
| Empty | N/A — no list view |
| Loading | Submit button shows inline spinner; all fields and toggle disabled |
| Error | Inline field errors for client-side validation; banner above submit for server errors ("Invalid email or password", "User already exists") with retry by re-submitting |
| Null fields | N/A |
| Unauthenticated | This screen IS the unauthenticated entry point |

**Accessibility**

- Modal traps focus while open and returns focus to the trigger on close.
- All inputs have associated `<label>` elements.
- Password field has a "Show password" toggle reachable by keyboard.

---

### 3.2 Home

**Route:** `/`

**Goal:** Introduce FoodExpress, surface popular categories, route the visitor to the menu — with a cinematic, motion-driven presentation modelled after premium product pages.

**Sections (top to bottom)**

1. **Scroll-progress bar** — fixed at the top of the viewport, scales horizontally with scroll position; gradient (`#ff6b35 → #ffd166`); decorative (`aria-hidden="true"`); height 3 px.
2. **Cinematic hero** —
   - Full-viewport dark gradient background with three drifting blurred orbs (primary / accent / pink) and a faint dot-grid overlay masked to the centre.
   - Eyebrow chip: "Now delivering in your city" with a pulsing dot.
   - Headline "Delicious food, delivered to your door." rendered word-by-word with staggered fade-in/slide-up; final word "door." carries a warm orange→yellow gradient. The full heading is also exposed via `aria-label` so screen readers receive it as a single phrase.
   - Sub-copy, "Order now" primary CTA → `/menu`, "Learn more" ghost CTA → `/about`.
   - Hero image (from `VITE_CLOUDINARY_HERO_IMAGE`, falls back to local asset) with a mouse-tracking 3D tilt (rotateX/rotateY based on cursor position; ±8°) and an animated gradient glow halo.
   - Two floating glassmorphism info cards: rating ("4.9★ — 50K+ reviews") and ETA ("~28 min — Avg ETA"). Hidden on screens < 600 px.
3. **Marquee** — horizontal auto-scrolling band on a dark background, listing food categories. Decorative (`aria-hidden="true"`).
4. **Stats grid** — 4 animated counters (`30 min`, `10K+`, `500+`, `4.9★`) that count up via `requestAnimationFrame` with an ease-out cubic curve once the section enters the viewport. Each runs once.
5. **Popular Categories** — grid of category cards fetched from `GET /api/begin`. Each card: image (with `loading="lazy"`), category name, arrow icon → `/menu`. On hover: lift, shadow expand, image zoom (1.08×), arrow morph to filled primary circle. Cards stagger their reveal by 60 ms each.
6. **How It Works** — three steps in a grid with a soft gradient connector line behind them. Each step has a numbered badge ("01", "02", "03") with a primary gradient fill. Cards reveal with 120 ms stagger.
7. **Final CTA** — full-bleed dark section with a real-time mouse-tracking radial spotlight (600 px circle of warm orange light following the cursor). Heading uses a white→translucent gradient. Primary CTA → `/menu`.

**Motion & effects (cross-cutting on this page)**

- **Scroll-reveal:** every element marked `data-reveal` fades up (`translateY(28px) → 0`, `opacity 0 → 1`) over 0.9 s once it enters the viewport. Implemented with a single `IntersectionObserver` (threshold 0.15, root margin `-60px` bottom). Each target is unobserved after revealing — no re-trigger.
- **Reduced motion:** if `prefers-reduced-motion: reduce` is set, all decorative animations (scroll-reveal, orb drift, marquee, image tilt, spotlight tracking, counter count-up, pulsing dot, floating cards) are disabled. Counters jump straight to their final value. The marquee renders static. The page remains fully functional.
- **GPU-friendly only:** all animations use `transform` and `opacity`. No layout-thrashing properties are animated.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | All sections render in full with motion enabled |
| Empty | Popular Categories returns `[]` → hide the section entirely (do not show an empty grid). Other sections remain |
| Loading | Stats counters start at 0 and animate up on viewport entry; categories grid not rendered until data arrives |
| Error | `GET /api/begin` failure → popular dishes set to `[]`; Categories section is hidden. The rest of the page still renders. (Inline error card with "Retry" is out of scope for the v1 motion pass; tracked for follow-up.) |
| Null fields | Category with no image → broken `<img>` is currently possible because the API contract guarantees `url`. Add `onError` fallback before this is treated as production-hardened |
| Unauthenticated | Page is fully accessible; CTAs route to `/menu` (Menu page itself handles the gated state) |

---

### 3.3 About

**Route:** `/about`

**Goal:** Describe the brand.

Static page. Content is editorial copy + a single illustrative image. No API calls.

**State coverage:** Default only. No loading / empty / error / unauthenticated variants. Image must always have descriptive `alt` text.

---

### 3.4 Contact

**Route:** `/contact`

**Goal:** Provide support channels and location.

**Displayed information**

- Address (Mumbai, IN)
- Phone — rendered as `<a href="tel:…">`
- Email — rendered as `<a href="mailto:…">`
- Working hours
- Embedded Google Map iframe with `title` attribute for screen readers

**State coverage:** Default only. Tel/mailto links must be keyboard-focusable with visible focus styles.

---

### 3.5 Menu

**Route:** `/menu` — **authenticated only**

**Goal:** Let a signed-in user browse the categorised menu and add items to the cart.

**Layout**

- Categories rendered as section headers in order returned by API.
- Each category contains a responsive grid of item cards.
- Item card shows: image, name (display-safe), price (`formatCurrency`), veg/non-veg badge, add/quantity control.

**Quantity control behaviour**

- If item is not in cart: single "Add" button.
- If item is in cart: `−  {qty}  +` control. Disabled while a cart mutation is in flight for that item.
- Local optimistic update; reverts on API failure with an error toast.

**Backend**

- `GET /menu` (JWT required) → `{ categories: [{ name, items: [...] }] }`
- Cart mutations dispatched to the Cart endpoints (see §3.7).

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Full menu grid |
| Empty | API returns no categories → "Menu is being prepared — check back soon." + link to Home |
| Loading | Skeleton category section after 200 ms; subsequent category loads also skeletoned |
| Error | Full-page error card with "Retry" button; cached menu remains visible if the fetch was a refresh |
| Null fields | Item with no image → branded placeholder tile; item with no price → hide "Add" button and show "Coming soon" |
| Unauthenticated | In-page prompt: "Sign in to view the menu and order." Primary CTA opens AuthModal — no redirect, preserves URL |

---

### 3.6 User Profile

**Route:** `/profile` — **authenticated only**

**Goal:** Let a user view and edit their profile (avatar, name, email, phone, address).

**View mode**

- Avatar (Cloudinary URL or default `/avatar.png` fallback — must never render a broken image).
- Name (displayed via `displayName`).
- Email.
- Phone — shows `"Not added"` fallback when null.
- Address — shows `"Not added"` fallback when null.
- "Edit Profile" button.

**Edit mode**

- All five fields editable.
- Avatar upload uses `<input type="file" accept="image/*">`; shows preview before save.
- "Save" (primary) and "Cancel" (secondary) buttons.

**Validation (client-side, before submit)**

- Name: 2–50 chars, letters & spaces only.
- Email: RFC-like regex.
- Phone: Optional. If present, must match `/^[6-9]\d{9}$/` (10-digit Indian mobile).
- Address: Optional. Max 200 chars.
- Avatar: ≤ 2 MB; type `image/jpeg`, `image/png`, or `image/webp`.

**Backend**

- `GET /api/user/:id` (JWT required)
- `PUT /api/user/update/:id` (JWT required, `multipart/form-data` with optional `avatar` field)

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | View mode with current profile |
| Empty | N/A — a profile always exists once authenticated |
| Loading | Skeleton card after 200 ms; Save button shows inline spinner during submit |
| Error | Field-level errors for validation; banner above Save for server errors with "Retry" |
| Null fields | `phone`/`address` → `"Not added"`; `avatarUrl` → default avatar asset |
| Unauthenticated | Redirect to `/` and open AuthModal with message "Sign in to access your profile" |

---

### 3.7 Cart

**Surface:** Right-side drawer, opened from cart icon in Header.

**Goal:** Let a user review items, change quantities, clear the cart, and proceed to checkout.

**Displayed content**

- Item rows: image, name, category, price (`formatCurrency`), veg/non-veg badge, quantity stepper, remove button, line total (`formatCurrency`).
- Summary: Subtotal, Delivery Fee (currently "Free" — copy stored as a constant, not hardcoded inline), Total.
- Footer actions: "Clear Cart" (destructive, requires confirmation Prompt), "Proceed to Checkout" (primary).

**Backend**

| Action | Endpoint |
|--------|----------|
| Fetch cart | `GET /api/cart` |
| Add item | `POST /api/cart/add` |
| Update qty | `PUT /api/cart/item/:itemId` |
| Remove item | `DELETE /api/cart/item/:itemId` |
| Clear cart | `DELETE /api/cart/clear` |

All require JWT. All mutations return the updated cart; client replaces local state from the response (no merging logic).

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Item list + summary + footer actions |
| Empty | Decorative illustration + "Your cart is empty" + primary CTA "Browse Menu" → `/menu`. Footer actions hidden |
| Loading | Skeleton rows when drawer opens; per-row spinner during +/-/remove operations |
| Error | Error toast for failed mutations; row reverts to last known good state. A full-cart fetch failure shows in-drawer error card with "Retry" |
| Null fields | Item without image → placeholder tile; item without category → hide category line (do not show "undefined") |
| Unauthenticated | Drawer cannot be opened — cart icon is hidden in the Header when not authenticated |

**Confirmation Prompt**

"Clear Cart" must open the existing `Prompt` component with message: "Remove all items from your cart? This can't be undone." Confirm button is destructive-styled.

---

### 3.8 Header

**Always visible** on every route. Sticky to the top of the viewport with `z-index: 100`.

**Visual shell**

- Frosted-glass background — `rgba(255, 255, 255, 0.7)` + `backdrop-filter: saturate(160%) blur(18px)`. Bleeds through the section behind it (subtle on dark hero, near-white on light pages).
- **Scroll-aware:** once `window.scrollY > 30`, the header adds `.is-scrolled`:
  - Background becomes `rgba(255, 255, 255, 0.92)`.
  - Bottom border + soft drop shadow appear.
  - Container height shrinks from 72 px → 64 px.
- Container max-width: 1240 px. Fluid horizontal padding `clamp(16px, 4vw, 36px)`.

**Contents (left → right)**

1. **Logo** — circular badge image (`logo-icon`) with a warm drop shadow, next to a gradient-text "FoodExpress" wordmark (`#ff6b35 → #e0531f`). Clickable, routes to `/`. Slight lift on hover.
2. **Primary nav** — Home, Menu, About, Contact. Each link:
   - Pill-shaped on hover (`rgba(255, 107, 53, 0.06)` background).
   - Animated gradient underline that scales in from the left on hover and stays scaled when active.
   - Active route detected via `useLocation` — exact match on `/`, prefix match for others. Announced via `aria-current="page"`.
3. **Actions cluster** (right side, gap 10 px):
   - **Cart button** (authenticated only) — 42 × 42 px rounded square; outline SVG cart glyph (no emoji per the icon rule); subtle background on hover. Badge in the top-right shows count (clamped to `99+`); badge pulses (`scale 1 → 1.35 → 0.92 → 1` over 420 ms) whenever the count changes. Hidden when signed out. `aria-label` reads `"Open cart, N items"` (singular/plural).
   - **User chip** (authenticated only) — pill containing a circular avatar (resolved via `resolveAvatar`, falls back to `/avatar.png`), the user's name (truncated to 140 px), and a chevron that flips 180° when the dropdown is open. `aria-haspopup="menu"`, `aria-expanded`. Hover lifts and warms the border.
   - **Profile dropdown** — anchored top-right under the chip, 200 px wide, white card with soft shadow. Animates in (fade + scale `0.96 → 1` + drop `-6px → 0`) over 220 ms. Items: "View profile" (navigates to `/profile`) and "Sign out" (destructive — red text, red-tinted hover; shows a toast then logs out after 2 s). Closes on outside click or route change.
   - **Sign-in button** (unauthenticated only) — gradient pill (`primary → primary-soft` with `accent` over on hover), glowing shadow, lifts on hover. Opens AuthModal.
   - **Menu toggle** (mobile only) — hamburger icon that morphs to a close X when the mobile nav drawer is open.

**Responsive behaviour**

- **≤ 860 px:** primary nav collapses into a drawer below the header. Hamburger button toggles it. Drawer animates open via `max-height` (0 → 360 px) with a soft shadow. Nav links stack vertically with larger tap targets (44+ px height). User-chip name is hidden — avatar only. Drawer auto-closes on route change.
- **≤ 480 px:** Sign-in button uses a smaller padding/font size.

**Motion**

- All transitions use a single shared `cubic-bezier(0.16, 1, 0.3, 1)` easing.
- Cart-badge pulse is keyed to `itemCount` changes via a 420 ms `is-bump` class toggled in a `useEffect`.
- `prefers-reduced-motion: reduce` disables all transitions and animations in the header.

**Accessibility**

- All interactive elements are `<button>` or `<a>` (no clickable `<div>`s).
- Cart button has descriptive `aria-label`.
- Nav uses `aria-label="Primary"`; active link uses `aria-current="page"`.
- User chip uses `aria-haspopup="menu"` and `aria-expanded`; dropdown uses `role="menu"` and `role="menuitem"`.
- Logo image has empty `alt=""` because the adjacent wordmark already labels the link, which carries `aria-label="FoodExpress home"`.
- Every focusable element has a visible `:focus-visible` ring (2 px primary, 2–4 px offset).

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | All elements render as above; scroll-aware shell tracks scroll position |
| Empty | N/A |
| Loading | During auth bootstrap on app load, user area shows a small skeleton — never a "Sign In" flash that would then disappear *(skeleton placeholder is a planned addition; currently flashes Sign-in)* |
| Error | If `/api/user/:id` fails on bootstrap, user is signed out and "Sign In" is shown |
| Null fields | Missing avatar → `/avatar.png` fallback; missing name → `"Member"` *(via shared `displayName` utility — not yet wired in)* |
| Unauthenticated | Cart button hidden; user chip hidden; "Sign In" button shown |

---

### 3.9 Footer

**Visible** on Home and Menu pages.

Static content: company blurb, quick links (Home, Menu, About Us, Contact), contact info, dynamic copyright year (computed via `formatDate(new Date(), "year")`, never `new Date().getFullYear()` inline).

---

### 3.10 Toast Notifications

**Component:** `ToastMessage`.

**Types:** `success`, `error`, `progress`, `default`.

**Rules**

- Auto-dismiss after 3000 ms (constant: `TOAST_DISMISS_MS`, defined in `constants/ToastConstants.js`).
- Stacked vertically; max 3 simultaneous toasts; oldest is dismissed if the queue exceeds 3.
- Each toast is keyboard-dismissible (Esc dismisses the most recent).
- Error toasts include a "Retry" affordance when the triggering action is retryable; the affordance is keyboard-focusable.

---

### 3.11 404 / Not Found

**Route:** `*`

**Goal:** Recover the user when they land on an unknown URL.

Show a message ("This page doesn't exist") + primary CTA → `/`. No API calls; no other states needed.

---

## 4. Context & Session Rules

### 4.1 AuthContext

- Source of truth for `currentUser` and `authToken`.
- Hydrates from `localStorage.authToken` on app boot; calls `GET /api/user/:id` to validate.
- On `HTTP 419` (token expired) from any request: clears storage, signs the user out, shows toast "Your session expired — please sign in again", and opens AuthModal.
- Exposes `login(credentials)`, `signUp(payload)`, `logout()`, `updateUser(patch)`.

### 4.2 CartContext

- Source of truth for cart state.
- Auto-fetches cart on sign-in; clears cart on sign-out.
- Every mutation method (`addItem`, `updateQuantity`, `removeItem`, `clearCart`) is async and returns the updated cart for callers that need it.
- Never derives totals client-side — uses the totals returned by the API to avoid drift.

### 4.3 ModalContext

- Single-modal-at-a-time policy. Opening a second modal closes the first.
- Restores focus to the element that opened the modal on close.

### 4.4 ToastContext

- Queue-managed (see §3.10).

---

## 5. Validation Summary

### 5.1 Frontend (`services/validationservice.js`)

| Field | Rule |
|-------|------|
| Name | 2–50 chars, letters & spaces only |
| Email | RFC-like regex |
| Password | Min 8; ≥ 1 upper, 1 lower, 1 digit, 1 special |
| Phone | 10-digit Indian mobile starting 6–9 |

### 5.2 Backend (Joi middlewares)

| Endpoint | Rule |
|----------|------|
| `POST /auth/signup` | name 2–50, email valid, password min 6 — **must be raised to 8 to match frontend** |
| `POST /auth/login` | email valid, password present |
| `PUT /api/user/update/:id` | name, email, phone (Indian 10-digit), address optional |
| `POST /api/cart/add` | item with name + price, category present, quantity ≥ 1 |
| `PUT /api/cart/item/:itemId` | quantity ≥ 1 |

### 5.3 Error Codes

| Code | Meaning | Client behaviour |
|------|---------|------------------|
| 400 | Validation failed | Surface field-level error or banner |
| 403 | Unauthorized | Open AuthModal; do not sign the user out |
| 419 | Token expired | Sign out, toast, open AuthModal |
| 500 | Server error | Generic "Something went wrong" toast with retry where applicable |

---

## 6. Accessibility Floor

These are non-negotiable per the referenced UI/UX rules:

- Every interactive element reachable by keyboard alone.
- Visible focus style on all focusable elements (never `outline: none` without a replacement).
- All form inputs have associated labels.
- All content images have descriptive `alt`; decorative images have `alt=""`.
- Color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text). Veg/non-veg badges must combine color with an icon or text — color alone is insufficient.
- Modals (AuthModal, Cart drawer, Prompt) trap focus and restore it on close.
- Dynamically-opened UI (toasts, modals) is announced to assistive tech via appropriate ARIA roles.

---

## 7. Out of Scope

These are explicitly **not** part of this spec and must not be built without an amendment:

- Checkout / payment flow (current "Proceed to Checkout" is a stub).
- Order history.
- Restaurant selection / multi-vendor.
- Reviews and ratings.
- Push notifications.
- Internationalisation beyond INR currency and English copy.

---

## 8. Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-05-22 | Initial draft | First version, derived from current codebase and UI/UX best-practice rules |
| 2026-05-22 | Home motion pass | Home page reworked with cinematic hero (orbs, kinetic typography, 3D image tilt, glass cards), scroll-progress bar, marquee, animated stats, scroll-reveal grids, mouse-spotlit final CTA. All effects respect `prefers-reduced-motion`. §3.2 expanded accordingly |
| 2026-05-22 | Header polish | Header rebuilt as a scroll-aware frosted-glass shell with animated underlines, SVG cart icon (replaces emoji), pulse-on-change cart badge, polished user chip + animated dropdown, mobile hamburger drawer, and full a11y semantics. §3.8 expanded accordingly |
