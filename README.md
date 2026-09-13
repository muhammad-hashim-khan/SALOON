# CUT&STYLE - Salon & Spa Management System

A production-oriented management system designed for **CUT&STYLE Salon & Spa** to streamline billing, expense management, staff access control, and financial reporting.

---

## 1. Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Router DOM v6
  - Lucide React (Icons)
  - Recharts (Analytics)
  - Zod
- **Backend**:
  - Node.js & Express.js
  - TypeScript
  - Zod (Request validation)
  - CORS, Dotenv
  - @supabase/supabase-js
- **Database & Security**:
  - Supabase PostgreSQL
  - Row Level Security (RLS) policies
  - Strict CHECK constraints and foreign keys
  - Auto-sequencing bill numbers (`CS-YYYY-XXXXXX`)
- **Authentication**:
  - Supabase Auth with RBAC (`ADMIN` & `WORKER`)

---

## 2. Folder Structure

```
d:/SALOON/
├── frontend/                     # React + Vite + TypeScript + Tailwind frontend
│   ├── public/
│   ├── src/
│   │   ├── components/           # Common components and layouts (AdminLayout, WorkerLayout, Sidebar, Header)
│   │   ├── pages/                # Route pages (Admin & Worker placeholder views)
│   │   ├── routes/               # React Router navigation configuration
│   │   ├── services/             # API & Supabase services
│   │   ├── hooks/                # Custom React hooks (useAuth)
│   │   ├── context/              # Global state & AuthContext
│   │   ├── types/                # Database and model interfaces
│   │   ├── lib/                  # Supabase client initializer
│   │   ├── utils/                # Currency and date formatters
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── backend/                      # Node.js + Express + TypeScript backend API
│   ├── src/
│   │   ├── config/               # Environment & Supabase config
│   │   ├── middleware/           # Error handler, Auth, Zod validator
│   │   ├── controllers/          # Health check & route controllers
│   │   ├── routes/               # API routes (/api/health)
│   │   ├── services/             # Backend service layer
│   │   ├── validators/           # Zod schemas (bills, expenses, profiles)
│   │   ├── utils/                # Logger, standard response helpers
│   │   ├── types/                # Backend TypeScript types
│   │   ├── app.ts                # Express app setup
│   │   └── server.ts             # Server entry point & graceful shutdown
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── supabase/
│   └── migrations/
│       └── 20260911_initial_schema.sql # PostgreSQL schema, constraints, sequences, RLS
├── docs/
│   ├── database_schema.md        # Database schema specifications & ERD
│   └── api_spec.md               # API endpoints documentation
└── README.md
```

---

## 3. Database & Supabase Setup

1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Open `supabase/migrations/20260911_initial_schema.sql` and run the entire SQL script.
4. This will set up:
   - `profiles` table (linked to `auth.users`)
   - `bills` table with auto bill sequence architecture (`CS-YYYY-XXXXXX`)
   - `bill_items` table with foreign key cascading
   - `expenses` table with category constraints
   - `audit_logs` table
   - Row Level Security (RLS) policies for `ADMIN` and `WORKER` roles.
5. In Supabase **Project Settings -> API**, copy your:
   - `Project URL`
   - `Anon Key`
   - `Service Role Key` (Keep secret on backend only)

---

## 4. Environment Variables

### Frontend (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> [!IMPORTANT]
> Never commit real secret keys into version control. `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the frontend.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js >= 18.0.0
- npm or pnpm or yarn

### Backend Setup & Execution
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run in development mode (hot reloading)
npm run dev

# Or build and run production bundle
npm run build
npm start

# Typecheck
npm run typecheck
```
The backend will run on `http://localhost:5000`. You can test health at `http://localhost:5000/api/health`.

### Frontend Setup & Execution
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build production bundle
npm run build

# Typecheck
npm run typecheck
```
The frontend will start on `http://localhost:3000`.

---

## 6. Routes Implemented (Phase 1)

| Route | Access | Purpose |
| :--- | :--- | :--- |
| `/login` | Public | Authentication & Role Switcher preview |
| `/admin/dashboard` | Admin | High-level salon metrics & sales overview |
| `/admin/bills` | Admin | Invoices across all workers & stations |
| `/admin/workers` | Admin | Worker account management |
| `/admin/expenses` | Admin | Operational salon expense tracking |
| `/admin/reports` | Admin | Financial, PDF/Excel/CSV exports |
| `/admin/settings` | Admin | System configuration & audit logs |
| `/worker/billing` | Worker | New bill generation (Cash / UPI) |
| `/worker/bills` | Worker | Invoices issued by the logged-in worker |

---

## 7. Phase 1 Verification

- **API Health Check**: `GET http://localhost:5000/api/health` returns:
  ```json
  {
    "success": true,
    "message": "CUT&STYLE API is running"
  }
  ```
- **TypeScript Checking**: Run `npm run typecheck` in both `frontend` and `backend` directories.
