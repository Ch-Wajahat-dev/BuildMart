================================================================================
                    IRONCRAFT HARDWARE SHOP - PROJECT README
================================================================================

PROJECT NAME:     IronCraft Hardware Shop (BuildMart Hardware)
PROJECT TYPE:     Full-Stack E-Commerce Web Application
TECH STACK:       Node.js, Express.js, MongoDB, Vanilla JavaScript, HTML5, CSS3
TEAM:             Group 2 - Gomal University Project

================================================================================
TABLE OF CONTENTS
================================================================================

  1. Project Overview
  2. Features
  3. Technologies Used
  4. Project Structure
  5. Prerequisites
  6. Installation & Setup
  7. Running the Application
  8. Default Accounts
  9. API Endpoints
  10. Product Categories
  11. Environment Variables

================================================================================
1. PROJECT OVERVIEW
================================================================================

IronCraft Hardware Shop is a full-stack hardware e-commerce platform that allows
customers to browse, search, and purchase hardware tools, electrical supplies,
plumbing materials, and construction products online. It includes a complete
admin dashboard for managing products, orders, and customers.

The application supports both guest and registered user sessions, JWT-based
authentication, a shopping cart system, and full order lifecycle management.

================================================================================
2. FEATURES
================================================================================

CUSTOMER FEATURES:
  - Browse 24+ hardware products across 8 categories
  - Search products by name/description
  - Filter by category, price range, and product flags (new, on-sale, featured)
  - Sort by price (asc/desc), rating, name, or newest
  - Add/remove items from shopping cart
  - Update item quantities in cart
  - Apply promotional discount codes:
      PIRMAHAL10  ->  10% off
      HARDWARE20  ->  20% off
      SAVE15      ->  15% off
  - Place orders with shipping details and payment method selection
  - View full order history and order details
  - Register and login with secure JWT authentication
  - Tax: 5% applied at checkout
  - Shipping: Rs. 250 flat rate (free on orders over Rs. 5,000)

ADMIN FEATURES:
  - Dashboard with live stats (products, users, orders, total revenue)
  - View top-selling products and low-stock alerts
  - Monitor and update order statuses:
      pending -> processing -> shipped -> delivered / cancelled
  - Create, edit, and delete products
  - View all registered customers

================================================================================
3. TECHNOLOGIES USED
================================================================================

BACKEND:
  - Node.js               Runtime environment
  - Express.js  v4.18.3   Web framework
  - MongoDB Atlas          Cloud database
  - Mongoose    v9.2.4    MongoDB ODM
  - bcryptjs    v2.4.3    Password hashing
  - jsonwebtoken v9.0.2   JWT authentication
  - express-session v1.18.0  Session management
  - dotenv      v16.4.5   Environment variable loader
  - cors        v2.8.5    Cross-Origin Resource Sharing

FRONTEND:
  - HTML5                 Page markup
  - CSS3                  Styling and layout
  - Vanilla JavaScript    Client-side logic (no frameworks)
  - Font Awesome v6.5.0   Icons
  - Fetch API             HTTP client for API calls

================================================================================
4. PROJECT STRUCTURE
================================================================================

group2/
├── server.js                  # Express app entry point
├── package.json               # Node.js project config and dependencies
├── .env                       # Environment variables (DB URI, secrets)
│
├── index.html                 # Home page
├── products.html              # Product listing page
├── cart.html                  # Shopping cart page
├── orders.html                # Customer order history page
├── login.html                 # Login / registration page
├── admin.html                 # Admin dashboard page
│
├── css/                       # Stylesheets
│
├── js/
│   ├── api.js                 # API client wrapper (all fetch calls)
│   ├── auth-modal.js          # Login/register modal logic
│   ├── main.js                # Homepage logic (categories, products, timer)
│   ├── admin.js               # Admin dashboard scripts
│   ├── products.js            # Products page scripts
│   ├── cart.js                # Cart helper functions
│   ├── cart-page.js           # Cart page scripts
│   ├── orders-page.js         # Order history display
│   └── data.js                # Fallback product data (offline mode)
│
├── database/
│   ├── db.js                  # Mongoose models (Category, Product, User, Order)
│   └── seed.js                # Database seeding script (24 products, 8 categories)
│
├── middleware/
│   └── auth.js                # JWT verification, optional auth, admin guard
│
├── routes/
│   ├── products.js            # Product CRUD API routes
│   ├── auth.js                # Register / login / profile routes
│   ├── cart.js                # Cart management routes
│   ├── orders.js              # Order placement and history routes
│   └── admin.js               # Admin stats and management routes
│
└── img/                       # Product images (24 images)

================================================================================
5. PREREQUISITES
================================================================================

Before running this project, ensure you have the following installed:

  - Node.js   v18 or higher   (https://nodejs.org)
  - npm       v8 or higher    (comes with Node.js)
  - Internet connection       (required for MongoDB Atlas cloud database)

================================================================================
6. INSTALLATION & SETUP
================================================================================

Step 1: Navigate to the project directory
  cd "D:\gomal projects\group2"

Step 2: Install dependencies
  npm install

Step 3: Verify the .env file exists with correct values (see Section 11)
  The .env file should already be present in the project root.

Step 4: (Optional) Seed the database with sample products and users
  npm run seed

  WARNING: Running seed will clear existing data and repopulate the database.
           Only run this on a fresh setup or when you want to reset the data.

================================================================================
7. RUNNING THE APPLICATION
================================================================================

START (production mode):
  npm start

START (development mode with auto-restart on file changes):
  npm run dev

Once started, open your browser and go to:
  http://localhost:3000

Other pages:
  http://localhost:3000/products.html   -> Browse products
  http://localhost:3000/cart.html       -> Shopping cart
  http://localhost:3000/orders.html     -> Order history
  http://localhost:3000/login.html      -> Login / register
  http://localhost:3000/admin.html      -> Admin dashboard

API health check:
  http://localhost:3000/api/health

================================================================================
8. DEFAULT ACCOUNTS
================================================================================

After seeding the database (npm run seed), the following accounts are available:

  ADMIN ACCOUNT:
    Email:    admin@ironcraft.pk
    Password: admin123
    Role:     admin (full access to admin dashboard)

  DEMO USER ACCOUNT:
    Email:    demo@ironcraft.pk
    Password: demo1234
    Role:     customer

You can also register a new customer account from the login page.

================================================================================
9. API ENDPOINTS
================================================================================

PRODUCTS:
  GET    /api/products              List products (supports filters & pagination)
  POST   /api/products              Create a product (admin only)
  GET    /api/products/categories   List all categories
  GET    /api/products/:id          Get product details
  PUT    /api/products/:id          Update a product (admin only)
  DELETE /api/products/:id          Delete a product (admin only)

AUTHENTICATION:
  POST   /api/auth/register         Register new user
  POST   /api/auth/login            Login and receive JWT token
  GET    /api/auth/me               Get current user profile (auth required)

CART:
  GET    /api/cart                  Get current cart
  POST   /api/cart                  Add item to cart
  PUT    /api/cart/:productId       Update cart item quantity
  DELETE /api/cart/:productId       Remove item from cart

ORDERS:
  POST   /api/orders                Place a new order (auth required)
  GET    /api/orders                Get order history (auth required)
  GET    /api/orders/:id            Get specific order details

ADMIN:
  GET    /api/admin/stats           Get dashboard statistics (admin only)
  GET    /api/admin/orders          List all orders (admin only)
  PUT    /api/admin/orders/:id      Update order status (admin only)
  GET    /api/admin/users           List all users (admin only)

SYSTEM:
  GET    /api/health                Server health check

================================================================================
10. PRODUCT CATEGORIES
================================================================================

The database is seeded with 8 categories and 24 sample products:

  Category              Products
  ─────────────────────────────────────────────────────────
  Hand Tools       (5)  Hammer, Screwdriver Set, Wrench Set,
                        Pliers Set, Measuring Tape
  Power Tools      (4)  Cordless Drill, Angle Grinder,
                        Circular Saw, Random Orbit Sander
  Electrical       (4)  Electrical Wire, Circuit Breaker,
                        Wall Socket, LED Bulbs
  Plumbing         (3)  PVC Pipes, Ball Valve, Kitchen Tap
  Safety           (3)  Safety Hard Hat, Work Gloves,
                        Safety Glasses
  Fasteners        (2)  Wood Screws Set, Bolts & Nuts
  Paint & Supplies (2)  Interior Wall Paint, Paint Brushes
  Building         (1)  Portland Cement

================================================================================
11. ENVIRONMENT VARIABLES
================================================================================

The .env file in the project root contains:

  PORT=3000
    -> Port the server listens on

  MONGODB_URI=mongodb+srv://...
    -> MongoDB Atlas connection string

  JWT_SECRET=ironcraft_secret_key_2024_gomal_hardware
    -> Secret key for signing JWT tokens

  SESSION_SECRET=ironcraft_session_secret_gomal_2024
    -> Secret key for express sessions (used for guest carts)

  NODE_ENV=development
    -> Application environment (development / production)

================================================================================
                            END OF README
================================================================================
