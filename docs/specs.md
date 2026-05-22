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

**Goal:** Introduce FoodExpress, surface popular categories, route the visitor to the menu.

**Sections**

1. **Hero** — heading "Delicious food, delivered to your door", supporting copy, "Order Now" CTA → `/menu`. Hero image from `VITE_CLOUDINARY_HERO_IMAGE` env var, falls back to local asset.
2. **Popular Categories** — grid of category cards fetched from `GET /api/begin`. Each card: image, category name, click → `/menu`.
3. **How It Works** — three static steps: Browse → Place Order → Get Delivered.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Hero, popular categories grid, How It Works |
| Empty | Popular Categories returns `[]` → hide the section entirely (do not show an empty grid) |
| Loading | Skeleton tiles for the category grid after 200 ms |
| Error | Category grid replaced by inline error card with "Retry" button; rest of page still renders |
| Null fields | Category with no image → render named placeholder tile; never broken `<img>` |
| Unauthenticated | Page is fully accessible; "Order Now" still routes to `/menu` (Menu page itself handles the gated state) |

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

**Always visible** on every route.

**Contents**

- Logo + "FoodExpress" wordmark — clickable, routes to `/`.
- Primary nav: Home, Menu, About Us, Contact. Active route is visually indicated and announced via `aria-current="page"`.
- Cart icon with item-count badge — visible only when authenticated. Opens Cart drawer.
- User area:
  - **Authenticated:** Avatar + name (via `displayName`) → opens dropdown with "Profile" and "Sign Out".
  - **Unauthenticated:** "Sign In" button → opens AuthModal.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | All elements as above |
| Empty | N/A |
| Loading | During auth bootstrap on app load, user area shows a small skeleton — never a "Sign In" flash that would then disappear |
| Error | If `/api/user/:id` fails on bootstrap, user is signed out and "Sign In" is shown |
| Null fields | Missing avatar → default avatar asset; missing name → `"Member"` |
| Unauthenticated | Cart icon hidden; "Sign In" button shown |

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
