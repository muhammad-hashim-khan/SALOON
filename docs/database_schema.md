# Database Schema Documentation - CUT&STYLE

This document specifies the PostgreSQL schema implemented in Supabase for the **CUT&STYLE Salon & Spa Management System** (Phase 1).

---

## Entity Relationship Overview

```
+------------------------------------+
|            auth.users              |
+------------------------------------+
                  |
                  | 1:1 (id = id)
                  v
+------------------------------------+
|             profiles               |
+------------------------------------+
| id (PK, UUID)                      |
| full_name (TEXT)                   |
| role (ADMIN | WORKER)              |
| status (ACTIVE | INACTIVE)         |
| created_at (TIMESTAMPTZ)           |
| updated_at (TIMESTAMPTZ)           |
+------------------------------------+
        |                     |
        | 1:N (worker_id)     | 1:N (created_by)
        v                     v
+------------------+   +------------------------------------+
|      bills       |   |              expenses              |
+------------------+   +------------------------------------+
| id (PK, UUID)    |   | id (PK, UUID)                      |
| bill_number (UQ) |   | category (RENT, ELECTRICITY, ...)  |
| worker_id (FK)   |   | description (TEXT)                 |
| customer_name    |   | amount (NUMERIC(12,2))             |
| customer_phone   |   | created_by (FK -> profiles.id)     |
| subtotal (NUM)   |   | expense_date (DATE)                |
| discount (NUM)   |   | created_at (TIMESTAMPTZ)           |
| total (NUM)      |   | updated_at (TIMESTAMPTZ)           |
| payment_method   |   +------------------------------------+
| created_at       |
+------------------+
        |
        | 1:N (bill_id)
        v
+-------------------------+
|       bill_items        |
+-------------------------+
| id (PK, UUID)           |
| bill_id (FK -> bills.id)|
| description (TEXT)      |
| amount (NUMERIC(12,2))  |
| created_at (TIMESTAMPTZ)|
+-------------------------+

+------------------------------------+
|             audit_logs             |
+------------------------------------+
| id (PK, UUID)                      |
| user_id (FK -> profiles.id)        |
| action (TEXT)                      |
| entity_type (TEXT)                 |
| entity_id (UUID, nullable)         |
| description (TEXT)                 |
| created_at (TIMESTAMPTZ)           |
+------------------------------------+
```

---

## Tables & Constraints

### 1. `profiles`
- Primary key: `id UUID` (references `auth.users(id) ON DELETE CASCADE`)
- Constraints:
  - `role IN ('ADMIN', 'WORKER')`
  - `status IN ('ACTIVE', 'INACTIVE')`
- Triggers:
  - `handle_updated_at()` updates `updated_at` before every row update.

### 2. `bills`
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- `bill_number TEXT UNIQUE NOT NULL`
- `worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- Constraints:
  - `subtotal >= 0`
  - `discount >= 0`
  - `total >= 0`
  - `payment_method IN ('CASH', 'UPI')`

### 3. `bill_items`
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- `bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE`
- `description TEXT NOT NULL`
- `amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0)`

### 4. `expenses`
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- `created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT`
- Constraints:
  - `amount > 0`
  - `category IN ('RENT', 'ELECTRICITY', 'WATER', 'SALARY', 'PRODUCTS', 'MAINTENANCE', 'MARKETING', 'OTHER')`

### 5. `audit_logs`
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `action TEXT NOT NULL`, `entity_type TEXT NOT NULL`, `description TEXT NOT NULL`

---

## Bill Number Format & Sequencing

- Sequence: `bill_number_seq`
- Format: `CS-YYYY-XXXXXX` (e.g. `CS-2026-000001`, `CS-2026-000002`)
- Function: `generate_bill_number()` generates unique consecutive bill identifiers per year.

---

## Row Level Security (RLS) Rules

1. **`profiles`**:
   - `ADMIN`: Full read/write access.
   - `WORKER`: SELECT access to own profile only.
2. **`bills`**:
   - `ADMIN`: Full read/write access.
   - `WORKER`: SELECT and INSERT only for bills where `worker_id = auth.uid()`.
3. **`bill_items`**:
   - `ADMIN`: Full read/write access.
   - `WORKER`: SELECT and INSERT only for items belonging to bills created by the authenticated worker.
4. **`expenses`**:
   - `ADMIN`: Full read/write access.
   - `WORKER`: Zero access (no read, insert, update, or delete).
5. **`audit_logs`**:
   - `ADMIN`: Full read access.
   - `AUTHENTICATED`: Insert own action logs.
