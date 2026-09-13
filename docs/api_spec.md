# API Specification - CUT&STYLE Backend (Phase 1)

This document provides the API specifications for the Express.js backend.

---

## Base URL

- Development: `http://localhost:5000/api`

---

## Endpoints

### 1. Health Check

Checks system availability and service health.

- **URL:** `GET /health`
- **Authentication:** None
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "CUT&STYLE API is running"
  }
  ```

### 2. Get Current Authenticated Profile

- **URL:** `GET /auth/me`
- **Authentication:** Bearer Token (Required)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid-here",
      "email": "admin@cutandstyle.com",
      "fullName": "Salon Administrator",
      "role": "ADMIN"
    }
  }
  ```
- **Response `401 Unauthorized`:**
  ```json
  {
    "success": false,
    "message": "Authentication required"
  }
  ```

### 3. Admin Authorization Test

- **URL:** `GET /auth/admin-test`
- **Authentication:** Bearer Token (Role: `ADMIN`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Admin authorization successful"
  }
  ```
- **Response `403 Forbidden` (Worker Role):**
  ```json
  {
    "success": false,
    "message": "You do not have permission to perform this action"
  }
  ```

### 4. Worker Authorization Test

- **URL:** `GET /auth/worker-test`
- **Authentication:** Bearer Token (Role: `WORKER`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Worker authorization successful"
  }
  ```
- **Response `403 Forbidden` (Admin Role):**
  ```json
  {
    "success": false,
    "message": "You do not have permission to perform this action"
  }
  ```
