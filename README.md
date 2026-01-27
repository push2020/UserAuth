# Food Express - Food Delivery Application

A full-stack food delivery application built with React, Express, and MongoDB.

## Features

- 🔐 User Authentication (Sign up, Login, JWT)
- 🛒 Shopping Cart
- 📍 Location Detection
- 🍽️ Menu Management
- 👤 User Profile Management
- 🎨 Modern UI/UX

## Tech Stack

- **Frontend**: React, Vite, SCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install all dependencies** (root, backend, and frontend):
   ```bash
   npm run install-all
   ```

   Or install manually:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables**:
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   ```

3. **Run both servers with a single command**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:8080`
   - Frontend development server on `http://localhost:5173` (or next available port)

### Available Scripts

From the root directory:

- `npm run dev` - Run both frontend and backend servers concurrently
- `npm run server` - Run only the backend server
- `npm run client` - Run only the frontend server
- `npm run install-all` - Install dependencies for root, backend, and frontend
- `npm run build` - Build the frontend for production

### Running Servers Individually

If you prefer to run servers separately:

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Project Structure

```
UserAuthentication/
├── backend/          # Express.js backend
│   ├── Controllers/  # Route controllers
│   ├── Models/       # MongoDB models
│   ├── Routes/       # API routes
│   ├── Middlewares/  # Custom middlewares
│   └── server.js     # Server entry point
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   └── services/    # API services
│   └── vite.config.js
└── package.json      # Root package.json for running both servers
```

## API Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /api/user/:id` - Get user details
- `PUT /api/user/update/:id` - Update user profile
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/item/:itemId` - Update cart item quantity
- `DELETE /api/cart/item/:itemId` - Remove item from cart

## Development

The project uses:
- **Concurrently** to run multiple npm scripts simultaneously
- **Nodemon** for backend auto-reload
- **Vite** for fast frontend development

## License

ISC
