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

**Rendering**

- Rendered via `ReactDOM.createPortal(modal, document.body)`. **This is non-negotiable** — the Header has `backdrop-filter` set, which creates a new containing block for any `position: fixed` descendant. Without the portal, the modal-overlay clips to the Header's bounds (see screenshot in the May 22 PR for what this regression looks like). Future contributors who refactor the modal must preserve the portal.
- Body scroll is locked (`document.body.style.overflow = "hidden"`) while open and restored to its previous value on close.

**Goal:** Let a visitor create an account or sign back in so they can order.

**Visual shell**

- Backdrop: `rgba(10, 10, 13, 0.55)` over an 8 px `backdrop-filter: blur`. Fades in over 250 ms.
- Card: 440 px max-width, white, 24 px radius, soft drop shadow + inset highlight. Two decorative gradient orbs (primary, accent) bleed through the top corners. Card animates in from `translateY(20px) scale(0.96)` to rest.
- Header: gradient eyebrow "Welcome back" / "Join us", large gradient title, supporting copy.

**Inputs**

| Field | Sign Up | Sign In | Validation |
|-------|---------|---------|------------|
| Full Name | required | — | 2–50 chars; letters and spaces only (`/^[a-zA-Z\s]+$/`) |
| Email | required | required | RFC-like regex; trimmed; lowercased on submit |
| Password | required | required | Min 8 chars; ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 digit, ≥ 1 special |

Each input has an explicit `<label>` linked via `htmlFor`/`id`. Inputs use `autoComplete="name" | "email" | "current-password" | "new-password"` so password managers behave correctly. Password field has a show/hide eye toggle (a real `<button>` with keyboard support and `aria-label`).

> **Note:** Backend currently accepts a 6-char minimum password. Backend must be tightened to match the 8-char rule above before this spec ships. Until then, the frontend enforces the stricter rule and rejects locally.

**Validation logic**

`isPayloadValid(data)` walks every supplied field and returns `false` on the first failure (an earlier bug returned only the result of the last iterated field — fixed in the May 22 polish pass). Submission is blocked client-side when validation fails and a toast describes the rule.

**Actions**

- Submit — full-width gradient pill. Disabled and shows an inline spinner while a request is in flight.
- Form `onSubmit` is bound so the Enter key submits (the previous version had the handler on the button's `onClick` only, which broke Enter-to-submit).
- Toggle between Sign Up / Sign In is a real `<button>` (was a `<span onClick>` — invalid semantics).
- Close: X icon top-right, **or** Escape key, **or** click on backdrop.

**Backend**

- `POST /auth/signup` → `{ message, user }`
- `POST /auth/login` → `{ message, jwtToken, user: { id } }`
- On login success: store JWT in `localStorage.authToken` and on `AppConstants.Auth_Token`, then `GET /api/user/:id` for the full profile, persist it as `localStorage.userProfile`, hydrate `AuthContext`, fire success toast, close modal after a 2 s read time.
- On signup success: flip to login mode (user signs in with their new credentials).

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Empty form, password hidden, submit enabled |
| Empty | N/A — no list view |
| Loading | Submit button disabled and shows an inline spinner; all fields remain readable but the form is non-interactive via submit disable |
| Error | Client-side validation → descriptive toast (rule-explaining body). Server error → toast with `error.message` (e.g. "Invalid email or password", "User already exists"). User stays on the modal and can retry |
| Null fields | N/A |
| Unauthenticated | This screen IS the unauthenticated entry point |

**Accessibility**

- Card has `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title.
- First field is focused on open (60 ms timeout so the animation doesn't fight the focus ring).
- Close button has `aria-label="Close"`; password toggle has `aria-label="Show password"` / `"Hide password"`.
- All inputs have visible labels (no placeholder-only labels).
- Escape closes the modal.
- All focusable elements have a visible `:focus-visible` ring.
- `prefers-reduced-motion: reduce` disables the entry animations, hover transitions, and the submit spinner's rotation.

> **Planned upgrade:** full focus-trap (cycle Tab inside the modal) and focus-return-to-trigger on close. Today only initial focus is implemented; Tab can leave the modal into the underlying header.

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

**Goal:** Describe the brand and surface what we stand for.

**Structure**

1. **Hero** — dark gradient banner with two drifting orbs, pulsing-dot eyebrow ("Our story"), gradient heading "About FoodExpress", supporting copy.
2. **Feature card** — split 2-column card (image left, copy right) with a "Browse the menu" CTA → `/menu`. Collapses to single column ≤ 800 px.
3. **Values grid** — three cards ("Fast delivery", "Curated kitchens", "Transparent prices") each with an indexed eyebrow ("01"/"02"/"03"), title, and supporting copy. Staggered scroll-reveal (80 ms per card via `--reveal-delay`).

Static page — no API calls.

**State coverage:** Default only. Scroll-reveal disabled under `prefers-reduced-motion`. All content images have descriptive `alt` text.

---

### 3.4 Contact

**Route:** `/contact`

**Goal:** Provide support channels and physical location.

**Structure**

1. **Hero** — same dark gradient pattern as About; eyebrow "Talk to us", heading "Get in touch".
2. **Contact grid** — 2-column layout (collapses to 1 column ≤ 860 px):
   - **"Reach us" card** — list of four rows. Each row pairs an SVG glyph in a primary-tinted square (pin / phone / mail / clock — no emoji per the icon rule) with a label and value. Phone uses `tel:`, email uses `mailto:`.
   - **Map card** — embedded Google Map iframe with `title="FoodExpress office map"`, lazy loaded, fills its container.

**State coverage:** Default only. All links keyboard-focusable with visible focus rings. Map iframe is `loading="lazy"`.

---

### 3.5 Menu

**Route:** `/menu` — **authenticated only**

**Goal:** Let a signed-in user browse the categorised menu and add items to the cart.

**Page structure**

1. **Menu hero** (always rendered, in every state) — full-width dark gradient banner with two drifting blurred orbs and a centre-masked dot grid. Contents:
   - Pulsing-dot eyebrow chip "Today's menu".
   - Large gradient heading "Explore the menu" (white → translucent white).
   - Supporting copy.
2. **Category sections** — alternate between paper (white) and paper-2 (cream) backgrounds for visual rhythm.
   - Eyebrow ("Category") + name as a section header.
   - Responsive grid (`auto-fill, minmax(260px, 1fr)`).
3. **Footer** (see §3.9).

**Item card**

- Aspect-ratio 4:3 image with hover zoom (1.06×) and graceful `onError` swap to `menu.defaultImage`. Image carries `loading="lazy"`.
- **Veg / non-veg chip** — frosted-white pill on the top-left of the image. Combines colour AND a bordered square + dot (Indian veg-symbol convention). Exposes `aria-label="Vegetarian"` / `"Non-vegetarian"` so screen readers don't rely on colour. (Satisfies the UI/UX rule: "Color is not the only signal".)
- Title, price (with ₹ prefix), quantity control.
- Hover: card lifts 4 px, soft shadow expands, border warms to a primary tint.

**Quantity control**

- When count is 0 → single gradient "Add" pill button with a `+` icon.
- When count is ≥ 1 → three-segment stepper inside a gradient pill: `[−] [count] [+]`. Each segment is a real `<button>` (not a `<div onClick>`); group is wrapped in `role="group"` with an `aria-label` naming the item; the count is wrapped in `aria-live="polite"` so screen readers announce changes.
- Increment uses the same path whether the item is new (calls `addToCart`) or already in cart (calls `updateQuantity`). Decrement removes the line at count = 1.
- The payload passed to `addToCart` is destructured to strip the server's `_id` field — the caller's object is never mutated.

**Scroll-reveal**

Every `[data-reveal]` element (category headers, item cards) fades up 24 px with a 0.8 s ease-out on viewport entry. Cards stagger by 60 ms (up to 6 cards). Disabled when `prefers-reduced-motion: reduce`.

**Backend**

- `GET /menu` (JWT required) → `{ categories: [{ name, items: [...] }], defaultImage }`.
- Cart mutations dispatched to the Cart endpoints (see §3.7).

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Hero + alternating category sections + grid of cards |
| Empty | `categories: []` → "Menu is being prepared. Check back soon — fresh dishes are on the way." (hero still rendered) |
| Loading | While menu is fetching, the page shows the full-page `Loader` component centred in a 70vh wrapper. (Skeleton category sections are a planned upgrade.) |
| Error | "We couldn't load the menu" card with a "Try again" button that resets state and re-triggers the fetch. Hero still rendered. (Cached menu retention on refresh is a planned upgrade.) |
| Null fields | Item with no image → `defaultImage` fallback via the image `onError` handler. Item with no `_id` is supported (handler destructures defensively). |
| Unauthenticated | Hero still rendered. Below it: "Sign in to view the menu" card with a primary "Sign in" CTA that opens the `AuthModal` via `ModalContext.openModal`. URL is preserved — no redirect. |

---

### 3.6 User Profile

**Route:** `/profile` — **authenticated only** (gated state shown for unauthenticated visitors; no redirect)

**Goal:** Let a user view and edit their profile (avatar, name, email, phone, address).

**Page structure**

1. **Profile banner** — dark gradient header with two orbs and a pulsing-dot eyebrow ("Manage your account" / "Sign in to manage your details"), gradient heading.
2. **Profile card** — white card overlapping the banner by 40 px (negative top margin + `z-index`), shadowed.

**View mode**

- Circular avatar in a gradient ring (primary → accent). Falls back to `/avatar.png` if the user has no avatar. Avatar URL is resolved by `resolveAvatar` — handles `blob:` previews, full URLs, and API-relative paths.
- Name (large), email (muted) in the card header.
- Definition list with two field rows: Phone, Address. Each row has an uppercase primary eyebrow ("PHONE"/"ADDRESS") and a value. Empty values render `"Not added"` in italic muted style (so the absence is obvious).
- "Edit profile" primary CTA.

**Edit mode**

- Avatar button becomes clickable and shows a camera-glyph overlay; opens a hidden `<input type="file" accept="image/*">`. New file is previewed via `URL.createObjectURL` before save.
- All four fields render as labelled `<input>`s with proper `id` / `htmlFor`. Field types: `text`, `email`, `tel`, `text`.
- Form is wrapped in `<form onSubmit>` — Enter key submits.
- "Cancel" (secondary, ghost) reverts formData to the original user record and exits edit mode. "Save" (primary) submits.
- While saving: Save shows an inline spinner; both buttons are disabled.

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
| Null fields | `phone`/`address` → `"Not added"` (italic muted); `avatarUrl` → `/avatar.png` fallback |
| Unauthenticated | In-page gated card: "Sign in to view your profile" + primary "Sign in" CTA that opens AuthModal. URL is preserved — no redirect |

---

### 3.7 Cart

**Surface:** Right-side drawer, opened from cart icon in Header.

**Rendering**

- Rendered via `ReactDOM.createPortal(drawer, document.body)`. **Non-negotiable** — the Header has `backdrop-filter` set, which creates a containing block for any `position: fixed` descendant. Without the portal, the cart-overlay clips to the Header's bounds. (Same constraint as [[AuthModal §3.1]].)

**Goal:** Let a user review items, change quantities, clear the cart, and proceed to checkout.

**Visual shell**

- Frosted-dark backdrop over the page (`rgba(10,10,13,0.55)` + 6 px blur), fade-in.
- White drawer slides in from the right (max-width 520 px on desktop, full-width below 600 px).
- Body scroll locks while open; Escape closes; backdrop click closes.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the drawer.

**Header**

- Gradient eyebrow ("Your selection") + heading ("Your cart") + count line (e.g. "3 items" — singular/plural aware).
- Close button: SVG `×` (the old `×` unicode glyph is removed per the icon rule). Rotates 90° on hover.

**Item row**

- 80 × 80 image (64 × 64 below 600 px) with `loading="lazy"`. Missing image → SVG placeholder tile, not the previous `🍽️` emoji.
- Name (truncated to one line), capitalised category, **veg/non-veg chip with shape+colour** (bordered square + dot — matches the Menu chip), price.
- Gradient quantity stepper (matches the Menu stepper): real `<button>` segments wrapped in `role="group"` with `aria-label`-ed item name; count uses `aria-live="polite"`.
- Remove pill: ghost button with trash glyph, warms to danger-red on hover. `aria-label` includes the item name.
- Line total at the bottom, dashed top border.

**Footer**

- Summary rows: Subtotal, Delivery fee (`Free` shown in green), Total (larger, bolder, with top border).
- Action row: "Clear cart" (ghost) and "Proceed to checkout" (gradient primary).

**Destructive confirmation**

- Clicking "Clear cart" swaps the action row for an inline confirmation panel (red-tinted): "Remove all items from your cart?" + "Cancel" (ghost) and "Yes, clear" (danger). This replaces the previous `window.confirm()` call — no native browser prompt.
- Confirmation state resets whenever the drawer closes.

**Empty state**

- Centered SVG bag glyph in a soft circle, "Your cart is empty" heading, supporting copy, "Browse menu" ghost button that closes the drawer.

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
| Empty | SVG illustration + "Your cart is empty" + ghost "Browse menu" button. Footer actions hidden |
| Loading | (Planned) Skeleton rows when drawer opens; per-row spinner during +/-/remove operations |
| Error | Error toast for failed mutations; row reverts to last known good state. A full-cart fetch failure shows in-drawer error card with "Retry" (planned) |
| Null fields | Item without image → SVG placeholder tile; item without category → category line is hidden (no `"undefined"` text) |
| Unauthenticated | Drawer cannot be opened — cart button is hidden in the Header when not authenticated |

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

**Visible** on Home and Menu pages. (About, Contact, and Profile do not include it.)

**Visual shell**

- Dark radial gradient (`#161018 → #0a0a0d`) that blends with the Home page's final-CTA section and the Menu page's hero.
- Two large blurred orbs (primary and accent) drifting in the background at low opacity for atmosphere.
- Thin top border (`rgba(255,255,255,0.08)`) to mark the boundary.

**Layout**

A 4-column grid inside a 1240 px container. Collapses to 2 columns ≤ 900 px and 1 column ≤ 540 px.

1. **Brand** — gradient logo wordmark (matches Header), short tagline.
2. **Explore** — Quick links: Home, Menu, About, Contact. Each link has an animated gradient underline (scales in from the left on hover/focus, matching Header behaviour).
3. **Reach us** — Email (`mailto:`), phone (`tel:`), and the Mumbai address. Each row pairs an SVG glyph (envelope / handset / map-pin) with the value. Glyphs are decorative; the surrounding link text carries the meaning.
4. **Hours** — Operating days/hours plus a small live-status pill ("Kitchens open now") with a pulsing green dot.

**Bottom bar**

- Thin top divider, copyright on the left, "Crafted with care." on the right (muted).
- Year is computed inline via `new Date().getFullYear()`. The shared `formatDate` utility from §2.1 is the target once it exists; until then, this is the documented exception.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | All four columns + bottom bar render as above |
| Empty | N/A — fully static content |
| Loading | N/A |
| Error | N/A |
| Null fields | N/A — all content is hardcoded |
| Unauthenticated | No change — Footer is the same in both auth states |

**Accessibility**

- Logo link has `aria-label="FoodExpress home"`; the image's `alt` is empty so screen readers don't read the wordmark twice.
- All SVG glyphs are `aria-hidden="true"`.
- `tel:` and `mailto:` links inherit native semantics.
- All focusable elements have `:focus-visible` rings (2 px primary, 4 px offset).
- The pulsing status dot animation is disabled under `prefers-reduced-motion: reduce`.

---

### 3.10 Delivery Location

**Surface:** Location chip in the Header + `LocationModal` (portal-rendered to `document.body`).

**Goal:** Capture and persist the user's delivery address so it can be used when placing an order and saved to their profile.

**Header chip**

- Sits between the logo and the primary nav.
- Shows a pin icon + abbreviated first segment of the saved address (up to 24 chars, ellipsis-truncated).
- Shows "Set location" when no address is saved.
- A small primary-coloured dot appears when a location is set.
- Clicking always opens the LocationModal.
- Responsive: label hidden below 400 px (icon only remains).

**First-visit auto-open**

- On the very first visit (no `deliveryLocation` in `localStorage` and no `locationAsked` flag), the LocationModal opens automatically after a 1.2 s delay.
- On all subsequent visits, the modal only opens when the user clicks the chip.

**LocationModal — five UI states**

| State | Shown when | Content |
|-------|-----------|---------|
| `idle` | Modal opens | Two CTAs: "Detect my location" and "Enter address manually" |
| `detecting` | Geolocation API call in flight | Spinner + "Detecting your location…" |
| `detected` | Coords resolved + address geocoded | Address in a primary-tinted card; "Confirm" + "Enter a different address" buttons |
| `error` | Permission denied, timeout, or geocode failure | Error message in a red-tinted card + "Try again" + "Enter manually" |
| `manual` | User picked manual entry | Text input with label, Save and Back buttons |

**Geolocation flow**

1. `navigator.geolocation.getCurrentPosition()` called with `enableHighAccuracy: false`, 10 s timeout.
2. On success: coords passed to `reverseGeocode(lat, lng)` which calls the **Nominatim API** (OpenStreetMap, no API key required): `https://nominatim.openstreetmap.org/reverse?format=json&lat=…&lon=…`
3. Address is assembled from `road / suburb / city / state` fields. Fallback to `display_name`.
4. Address displayed for confirmation; user can confirm or switch to manual entry.
5. On error code 1 (permission denied), code 2 (position unavailable), or code 3 (timeout): descriptive message shown and manual entry offered.

**Manual entry**

- Single `<input>` with `autocomplete="street-address"` and a real `<label>`.
- Save button disabled while the input is empty.
- Submit on Enter.

**Saving**

- `saveLocation({ address, lat, lng, source })` stores to `LocationContext` state and `localStorage`.
- If the user is signed in, also calls `PUT /api/user/update/:id` silently with the address (background, no toast — failure is silent).
- On successful save: modal closes.

**Accessibility**

- Portal-rendered — not clipped by the Header's `backdrop-filter` containing block.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the heading.
- Esc closes the modal.
- Body scroll locks while open.
- Focus moves to the manual input when that view becomes active.
- All buttons have descriptive labels.

**State coverage**

| State | Behaviour |
|-------|-----------|
| Default | Header chip shows "Set location" or saved address; modal opens on click |
| Empty | No saved address — chip shows "Set location"; first-visit auto-open fires |
| Loading | Spinner in the `detecting` view |
| Error | Error view with descriptive message + retry + manual fallback |
| Null fields | If geocode returns null, error view shown |
| Unauthenticated | Full feature available; address saved to localStorage only (no profile sync) |

---

### 3.11 Toast Notifications

**Component:** `ToastMessage` — rendered into `document.body` via `createPortal` so it isn't clipped by ancestors with `backdrop-filter` or `transform`.

**Types:** `success` (green disc), `error` (red disc), `progress` (orange disc; icon spins), `default` (same as success).

**Visual shell**

- Frosted-dark card pinned to the top-right of the viewport (88 px from the top so it clears the sticky header; 20 px from the right). Below 480 px width, it stretches edge-to-edge with 12 px side gutters.
- 36 × 36 coloured icon disc on the left; title (bold, 0.92 rem) + body (muted, 0.82 rem) on the right.
- Bottom-edge progress bar animates `scaleX(1)` → `scaleX(0)` over the visible window — gives a visual countdown.
- Z-index `1500` (above modal overlays at 1000).

**Rules**

- Auto-dismiss after 3000 ms; fade animation takes another 500 ms before unmount.
- `role="status"` + `aria-live="polite"` so screen readers announce the title/body politely.
- Animations disabled under `prefers-reduced-motion: reduce` (the card just fades).

**Planned upgrades:**
- Stacking with a max of 3 concurrent toasts (oldest dismissed when exceeded). Today only one toast at a time is supported by `ToastContext`.
- Esc dismisses the most recent.
- "Retry" affordance on error toasts when the action is retryable.

---

### 3.11 404 / Not Found

**Route:** `*`

**Goal:** Recover the user when they land on an unknown URL — and do so in the same design language as the rest of the app.

**Layout**

- Full-bleed dark gradient with two drifting orbs and a centre-masked dot grid (matches the Menu / Profile heroes).
- Pulsing-dot eyebrow ("Lost crumb").
- Kinetic "404" headline: large white-gradient digits with the middle `0` filled with the primary→accent gradient and gently tilting (`rotate(-6deg) scale(1.04)`) on a 3.5 s ease-in-out loop. The full string is exposed to screen readers via `aria-label="404"` on the parent.
- Supporting copy ("The page you're looking for has been eaten — or never existed.").
- Primary CTA "Back to home" → `/` with the standard gradient pill + arrow that slides right on hover.

**State coverage:** Default only. No API calls. All motion disabled under `prefers-reduced-motion: reduce`.

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

### 4.5 LocationContext

**Purpose:** Manages the user's chosen delivery address and the LocationModal's open/close state.

**State shape:** `location: { address: string, lat: number|null, lng: number|null, source: 'auto'|'manual' } | null`

**Persistence:**
- Location is saved to `localStorage` key `deliveryLocation` (JSON).
- A flag `locationAsked` in `localStorage` prevents the modal from auto-opening on repeat visits.
- On first visit (no saved location, flag not set): modal opens automatically after a 1.2 s delay.

**Saving to profile:** `saveLocation(loc, user)` accepts an optional `user` argument. If a logged-in user is supplied, it silently calls `PUT /api/user/update/:id` with the address in the background — the user's profile address field stays in sync.

**Exposed API:**
- `location` — current delivery location or `null`
- `isModalOpen` — whether the LocationModal is visible
- `openModal()` — opens the modal
- `closeModal()` — closes the modal and sets the `locationAsked` flag
- `saveLocation(loc, user?)` — persists location + optionally syncs profile
- `clearLocation()` — clears location from state and localStorage

**Reverse geocoding:** exported helper `reverseGeocode(lat, lng)` calls the Nominatim API (OpenStreetMap, no key required) and returns a short human-readable string built from `road / suburb / city / state`. Returns `null` on failure.

### 4.6 Scroll restoration

- A single `<ScrollToTop />` component lives inside `<BrowserRouter>` (above `<Header />`) in `App.jsx`. It listens to `useLocation().pathname` and calls `window.scrollTo(0, 0)` on every change.
- Behaviour is **instant** (not smooth) so route transitions feel responsive rather than laggy.
- Hash changes (`#section` anchors) are intentionally ignored so in-page anchor links keep working.
- This is the only place in the app that owns window scroll restoration. Individual pages must not call `window.scrollTo` on mount — it would race with this component.

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
- Location-based menu filtering (e.g. showing only kitchens near the saved address) — location is currently captured and persisted but not used to filter API results.

---

## 8. Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-05-22 | Initial draft | First version, derived from current codebase and UI/UX best-practice rules |
| 2026-05-22 | Home motion pass | Home page reworked with cinematic hero (orbs, kinetic typography, 3D image tilt, glass cards), scroll-progress bar, marquee, animated stats, scroll-reveal grids, mouse-spotlit final CTA. All effects respect `prefers-reduced-motion`. §3.2 expanded accordingly |
| 2026-05-22 | Header polish | Header rebuilt as a scroll-aware frosted-glass shell with animated underlines, SVG cart icon (replaces emoji), pulse-on-change cart badge, polished user chip + animated dropdown, mobile hamburger drawer, and full a11y semantics. §3.8 expanded accordingly |
| 2026-05-22 | Footer + Menu polish | Footer rebuilt as a dark gradient 4-column layout with SVG contact glyphs, animated link underlines, and a live "Kitchens open now" pill. Menu page rebuilt with a cinematic hero, alternating category bands, scroll-revealed cards, a frosted veg/non-veg chip that uses shape+colour (not colour alone), a proper button-based quantity stepper (fixes invalid `<div onClick>` inside `<button>`), and dedicated empty / gated / error states. Removed `console.log` calls and prop mutation (`delete item._id`) from the Menu page. §3.5 and §3.9 expanded accordingly |
| 2026-05-22 | AuthModal fix + polish | **Bug fix:** modal was clipping to the Header because the Header's `backdrop-filter` creates a new containing block for fixed descendants. Modal now renders via `createPortal` to `document.body`. **Redesign:** dark blurred backdrop, frosted card with orb accents, gradient title, real `<label>` elements, show/hide password toggle, Enter-to-submit via form `onSubmit`, Esc-to-close, body scroll lock, disabled-with-spinner submit, real `<button>` toggle link. **Cleanups:** validation now fails on first invalid field (was returning only the last result); removed `console.log` calls; close glyph and toggle are SVG / `<button>` (no `×` unicode, no `<span onClick>`). §3.1 expanded accordingly |
| 2026-05-22 | Cart portal fix | **Bug fix:** Cart drawer was being clipped by the Header's `backdrop-filter` containing block (same root cause as the AuthModal bug above). Cart now renders via `createPortal` to `document.body`. §3.7 amended with the portal-requirement note |
| 2026-05-22 | Full-app design pass | Brought the rest of the app up to the new design language: Cart (full redesign — SVG glyphs replace `🛒` / `🍽️` / `×`, inline destructive confirmation replaces `window.confirm`, gradient stepper, frosted backdrop, ARIA dialog semantics, body scroll lock, Esc-to-close); ProfileCard + Profile route (banner + gradient-ring avatar + definition-list view mode + form with proper labels + spinner-on-save + Cancel reverts cleanly + in-page gated state for unauthenticated visitors); About (hero + feature card + values grid with staggered scroll-reveal); Contact (hero + 2-column grid with SVG contact glyphs — no emoji — + map card); NotFound (cinematic dark layout with kinetic gradient `0`); Toast (portal-rendered, top-right, frosted-dark with coloured icon disc and drain-bar countdown, removed `console.log` from ToastContext). §3.3, §3.4, §3.6, §3.7, §3.10, §3.11 all expanded |
| 2026-05-22 | Scroll-to-top on route change | Added a single `<ScrollToTop />` component inside `<BrowserRouter>` that resets `window.scrollTo(0, 0)` on every `pathname` change. Hash changes are ignored so in-page anchors still work. §4.6 added |
| 2026-05-22 | Delivery location feature | New `LocationContext` + `LocationModal` + Header chip. Browser geolocation → Nominatim reverse-geocode → address confirmation. Manual entry fallback. Persisted to `localStorage`; synced to user profile when signed in. Auto-opens on first visit. §3.10 and §4.5 added |
