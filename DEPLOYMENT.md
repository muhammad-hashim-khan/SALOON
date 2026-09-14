# Deployment Guide

The CUT&STYLE Salon & Spa Management System is architected as a split-stack application:
- **Frontend**: Vite + React (TypeScript)
- **Backend**: Express + Node.js (TypeScript)
- **Database / Auth**: Supabase

This guide outlines how to deploy both ends to production.

## 1. Database & Authentication (Supabase)

1. **Create a Production Project**: Create a new project in your Supabase dashboard.
2. **Apply Migrations**: 
   - Ensure the Supabase CLI is installed (`npm i -g supabase`).
   - Link your local project to your production Supabase project:
     ```bash
     cd frontend
     supabase link --project-ref your-production-project-ref
     ```
   - Push your migrations and seed data:
     ```bash
     supabase db push
     ```
3. **Configure Auth URL**: Go to Supabase Settings -> Authentication and add your production frontend URL (e.g., `https://cutandstyle.vercel.app`) to the **Site URL** and **Redirect URLs**.

## 2. Backend API (Render / Heroku / Railway)

The backend is a standard Node.js Express application.

### Render Deployment
1. Connect your GitHub repository to Render and create a new **Web Service**.
2. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render sets this automatically)
   - `FRONTEND_URL`: `https://your-frontend-domain.com` (Crucial for CORS)
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY`: `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`

## 3. Frontend (Vercel / Netlify)

The frontend is a Vite application optimized for static hosting.

### Vercel Deployment
1. Connect your GitHub repository to Vercel and import the project.
2. **Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
   - `VITE_API_URL`: `https://your-backend-domain.com/api` (The URL of your deployed backend)

## Production Checklist
- [x] **CORS Configuration**: The backend dynamically allows requests from `FRONTEND_URL`.
- [x] **Type Safety**: Both backend and frontend have been type-checked (`npm run typecheck`) to ensure zero TypeScript errors at build time.
- [x] **Print Styles**: The new reporting module is optimized for A4 printing across all modern browsers.
- [x] **Secure Routing**: Workers cannot access Admin routes in production due to client-side `<RoleRoute>` boundaries and Supabase RLS.
