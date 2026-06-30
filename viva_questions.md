# Viva Questions and Answers Guide - Claims System Project

Prepare for your project viva (oral examination) with these most likely questions, grouped by category.

---

## Category 1: Project Overview & Business Logic

### Q1: What is the core purpose of this project?
* **Answer**: The project is a **Goods Return and Damage Claim Portal** for Manikanta Enterprises. It automates the return pipeline for retail dealers who receive damaged, wrong, or expired stock. It bridges warehouse staff (who inspect goods) and managers (who approve replacements or credit notes).

### Q2: Explain the workflow of a claim in your system.
* **Answer**: A claim transitions through 5 stages:
  1. **Submitted**: Warehousing staff logs the return request.
  2. **Under Inspection**: Product condition is checked.
  3. **Awaiting Approval**: Inspector submits a recommendation (e.g., issue credit note).
  4. **Approved / Rejected**: Manager reviews the inspection and makes the final ruling.
  5. **Closed**: Final actions (like dispatching replacement stock) are finished.

### Q3: Why did you segregate roles in this project?
* **Answer**: To prevent internal errors and fraud. Warehouse staff are allowed to create claims and log physical damage reports, but they **cannot** approve refunds or credit notes. Only the General Manager has the authority to make financial decisions.

---

## Category 2: Frontend (React & Vite)

### Q4: Why did you choose React and Vite instead of traditional HTML/JS?
* **Answer**: 
  * **React** allows us to build a Single Page Application (SPA). The page updates dynamically without reloading, creating a smooth user experience.
  * **Vite** is a modern build tool that compiles code extremely fast and supports Hot Module Replacement (HMR) for fast development.

### Q5: How does the frontend communicate with the backend?
* **Answer**: The frontend uses the browser's standard **`fetch()` API** to make HTTP requests (like `GET`, `POST`, `PUT`) to the Node.js/Express backend server. The base URL of the API is defined dynamically in the project's config.

---

## Category 3: Backend (Node.js & Express)

### Q6: What is Express and what is its role in your project?
* **Answer**: Express is a minimal web application framework for Node.js. In our project, it runs the backend server, defines REST API routes (like `/api/claims`, `/api/auth`), parses request bodies, and connects to the database.

### Q7: How is User Authentication and Security handled?
* **Answer**: We use **JWT (JSON Web Tokens)**:
  1. When a user logs in, the backend verifies their password (which is hashed using **bcrypt**) and generates a signed token.
  2. The token is sent to the frontend and stored in `localStorage`.
  3. For every secure action, the frontend includes this token in the request header (`Authorization: Bearer <token>`).
  4. The backend verifies the token and user role before executing any query.

---

## Category 4: Database (PostgreSQL & SQL)

### Q8: What database are you using, and why?
* **Answer**: We use **PostgreSQL** in production (hosted on Render) and **SQLite** for local development. PostgreSQL is an enterprise-grade, relational database that supports complex SQL joins, concurrent connections, and secure storage, making it perfect for production portals.

### Q9: What is the purpose of the `audit_logs` table?
* **Answer**: It stores a chronological record of every system action (e.g., who logged in, who edited a claim, who approved a refund, and at what time). This is crucial for transparency, security reviews, and resolving employee mistakes.

---

## Category 5: Deployment & Configuration

### Q10: How and where is this project deployed?
* **Answer**: 
  * **Frontend**: Deployed on **Vercel** because it offers rapid globally-distributed static file hosting for React.
  * **Backend**: Hosted on **Render** as a Node Web Service.
  * **Database**: Managed **PostgreSQL** database hosted on Render.

### Q11: What is the purpose of `.env` files?
* **Answer**: `.env` files store **Environment Variables** (like `DATABASE_URL` and `JWT_SECRET`). This keeps sensitive configuration details and credentials out of the source code, securing them in production.
