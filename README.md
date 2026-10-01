# KA-Photographer — Backend API for Photographer Portfolio

## 📋 Overview

KA-Photographer is a backend service built with **Express** and **MongoDB** for a photographer's portfolio website. The application serves two primary purposes:

- **Photo Delivery & Admin Management** — Stores photo metadata (URL + Cloudinary publicId) and exposes endpoints for the frontend to fetch photo lists. Admin users can add and delete photos (with deletion also removing assets from Cloudinary). Admin authentication is cookie-based (JWT) and endpoints for photo modification are protected.

- **Booking/Contact Form** — Allows site visitors to submit booking/contact requests for photoshoots. Submissions are validated, rate-limited, and trigger email notifications to a Gmail account via Nodemailer.

## 🏗️ Architectural Highlights

- **Express + TypeScript** server with centralized error handling and helper `ctrlWrapper` for controller error management
- **MongoDB (Mongoose)** database for photo metadata storage and admin authentication
- **Cloudinary** for image hosting (backend stores photoUrl + publicId; frontend uploads then sends publicId/URL to backend)
- **Cookie-based JWT authentication** for admin flows (login/logout/current)
- **Rate limiting and validation** for booking endpoint to prevent abuse
- **Dev tooling**: Jest + supertest + mongodb-memory-server for tests, ESLint, Prettier, Husky, lint-staged

## ✨ Features

### 🔐 Authentication & Security
- JWT-based Authentication with HTTP-only cookies for admin access
- Password Hashing using bcryptjs for secure credential storage
- Protected Routes with middleware authentication
- Rate Limiting on booking endpoints to prevent abuse
- CORS Configuration for secure cross-origin requests
- Request Validation using Zod schemas

### 📸 Photo Management
- Cloudinary Integration for efficient photo storage and delivery
- Public Gallery Endpoint accessible to all users
- Admin-only Operations for adding and deleting photos
- MongoDB Database for storing photo metadata

### 📅 Booking System
- Email Notifications via Nodemailer to Gmail
- Rate Limiting to prevent spam submissions
- Form Validation with Zod for data integrity

### 🛠️ Development & Quality
- TypeScript for type safety and better developer experience
- ESLint & Prettier for code quality and consistency
- Husky & Lint-Staged for pre-commit hooks
- Jest Testing with Supertest for API testing
- MongoDB Memory Server for testing database

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM

### Key Dependencies
- **Authentication**: jsonwebtoken, bcryptjs, cookie-parser
- **Email**: nodemailer
- **Validation**: zod
- **Security**: cors, express-rate-limit, helmet (implied)
- **Development**: nodemon, typescript

### Development Tools
- **Testing**: jest, supertest, ts-jest, mongodb-memory-server
- **Linting**: eslint, @typescript-eslint
- **Formatting**: prettier
- **Git Hooks**: husky, lint-staged

# 📁 Project Structure

## Source Code (`src/`)

```
src/
├── config/                   # Configuration files
│   ├── cloudinary.ts          # Cloudinary setup
│   ├── connectDb.ts           # MongoDB connection
│   ├── cors.ts                # Cors configs
│   └── email.ts               # Email service configuration
│
├── controllers/             # Route controllers
│   ├── admin.controller.ts   # Admin authentication & operations
│   ├── booking.controller.ts # Contact/booking form handling
│   └── photo.controller.ts   # Photo CRUD operations
│
├── middleware/              # Custom middleware
│   ├── auth.ts               # Authentication & authorization
│   ├── errorHandler.middleware.ts  # Global error handling
│   └── validateContactForm.middleware.ts  # Booking form validation
│
├── models/                  # Mongoose models & schemas
│   ├── admin.model.ts        # Admin user schema
│   ├── booking.model.ts      # Booking form submissions
│   └── photo.model.ts        # Photo metadata schema
│
├── routes/                  # API route definitions
│   ├── admin.routes.ts       # Admin authentication routes
│   ├── booking.routes.ts     # Public booking routes
│   └── photo.routes.ts       # Public & protected photo routes
│
├── services/                # Business logic & external services
│   ├── admin.service.ts      # Admin authentication logic
│   ├── booking.service.ts    # Booking form processing
│   └── photo.service.ts      # Photo management logic
│
├── types/                   # TypeScript type definitions
├── dto/                     # Data Transfer Objects (API request/response shapes)
│
├── tests/                   # Test suites
│   ├── fixtures/             # Test data & mock objects
│   ├── init/                 # Test initialization scripts
│   ├── integration/          # Integration tests
│   ├── setup/                # Test configuration
│   └── utils/                # Test utilities
│
├── utils/                   # Reusable utility functions
│   ├── ctrlWrapper.ts        # Async controller wrapper
│   ├── customError.ts        # Custom error class
│   ├── generateTokenAndSetCookie.ts  # JWT generation
│   ├── getCookieOptions.ts   # Cookie configuration
│   ├── getErrorResponse.ts   # Standardized error responses
│   ├── pagination.ts         # Pagination helpers
│   ├── rateLimiter.ts        # Rate limiting middleware
│   └── sendEmail.ts          # Email sending utility
│
├── app.ts                   # Express app configuration
└── server.ts                # Server entry point
```

# 📖 API Documentation

## Base URL
https://api.yourdomain.com/api

## 🔐 Authentication Endpoints (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/login` | Admin login, returns JWT token in HTTP-only cookie | No |
| **DELETE** | `/logout` | Admin logout, clears authentication cookie | Yes |
| **GET** | `/current` | Get current admin information | Yes |

## 📸 Photo Endpoints (`/api/photos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **GET** | `/` | Get all photos (public gallery) with pagination support | No |
| **POST** | `/` | Upload new photo (with Cloudinary integration) | Yes (Admin) |
| **DELETE** | `/:id` | Delete photo by ID (removes from Cloudinary) | Yes (Admin) |

## 📅 Booking Endpoints (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/` | Submit booking/contact request (rate-limited) | No |

## 🔧 Environment Variables

Copy the following content to create your `.env` file:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGO_DB_URI=your_mongodb_connection_string_here
# Example: mongodb+srv://username:password@cluster.mongodb.net/databaseName

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# SECURITY & AUTHENTICATION
# ============================================
JWT_SECRET_KEY=your_super_secret_jwt_key_here
# Generate a strong random string for production

# ============================================
# DATABASE CONFIGURATION
# ============================================
MONGO_DB_URI=your_mongodb_connection_string_here
# Example: mongodb+srv://username:password@cluster.mongodb.net/databaseName

ALLOWED_ORIGINS=["https://your-frontend-domain.com"]
# Add all domains that should be allowed to access your API

# ============================================
# CLOUDINARY IMAGE STORAGE
# ============================================
# Get these from your Cloudinary dashboard: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ============================================
# EMAIL SERVICE (Nodemailer with Gmail)
# ============================================
# For Gmail, you need to generate an "App Password": 
# https://myaccount.google.com/apppasswords
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
# This is the email where booking notifications will be sent
ADMIN_EMAIL=notificationsemail@example.com
```

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager
- **Cloudinary** account (for image storage)
- **Gmail account** with App Password (for email notifications)

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ka-photographer-backend.git
   cd ka-photographer_server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Server will run at `http://localhost:5000`

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Development Scripts
```bash
# Development mode with hot reload
npm run dev

# Build TypeScript for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code with Prettier
npm run format
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- photo.integration.test.ts
```