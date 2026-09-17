# MongoDB Atlas Authentication System (Node.js + Express + JWT)

A lightweight and complete user authentication system built with **Node.js**, **Express**, **MongoDB Atlas (Mongoose)**, **bcryptjs**, and **JSON Web Tokens (JWT)**, featuring a modern interactive frontend UI.

---

## 🚀 Quick Start

### 1. Configure MongoDB Atlas

1. Sign in or create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0** cluster.
3. In **Database Access**, create a user (e.g. `authAdmin`) and a secure password.
4. In **Network Access**, add `0.0.0.0/0` (allow access from anywhere for development).
5. In **Database → Clusters**, click **Connect** → **Drivers** (Node.js) and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/auth_demo?retryWrites=true&w=majority
   ```
6. Open `.env` in this directory and replace `MONGODB_URI` with your connection string (inserting your database username and password).

### 2. Start the Server

```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 3. Open the UI

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required | Request Body |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account | No | `{ "username": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/login` | Authenticate user & get JWT | No | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Fetch profile of logged-in user | Yes (`Bearer <token>`) | None |
| `GET` | `/api/health` | Health & MongoDB connection check | No | None |

---

## 📂 Project Structure

```text
├── config/
│   └── db.js            # MongoDB Atlas connection handler & diagnostics
├── middleware/
│   └── auth.js          # JWT Bearer token authentication middleware
├── models/
│   └── User.js          # User schema with bcrypt pre-save password hashing
├── routes/
│   └── auth.js          # Auth controllers (register, login, me)
├── public/
│   ├── index.html       # Single-page UI with Auth cards & dashboard
│   ├── style.css        # Responsive, modern styling
│   └── app.js           # Client-side API interactions & token management
├── .env                 # Local environment variables (Mongo URI, JWT Secret)
├── .env.example         # Example configuration template
├── package.json         # Dependencies and scripts
├── server.js            # Express app server entrypoint
└── README.md            # Documentation
```

---

## 🔒 Security Best Practices Implemented

- **Password Hashing**: Passwords are automatically hashed with `bcryptjs` using a salt before storage.
- **Hidden Password Field**: The password field in the Mongoose schema has `select: false` so it is never leaked in queries.
- **JWT Protection**: Protected routes verify JWT integrity and extract the payload securely.
- **Graceful Error Handling**: Database connection issues, invalid credentials, and duplicate registration attempts are handled cleanly with descriptive feedback.
