# Full Deployment & Handover Pathway

The CUT&STYLE Salon System requires a three-part deployment architecture. Follow this exact sequence to take the project from your local machine to the internet.

---

## STEP 1: Database & Authentication (Supabase)

Supabase serves as the central hub. It must be deployed first so you have API keys for the backend and frontend.

1. **Create Project**: Go to [Supabase](https://supabase.com), create a new project (e.g., `cut-and-style-prod`).
2. **Retrieve Keys**: Once provisioned, go to **Project Settings > API**. Copy the `Project URL`, `anon / public key`, and `service_role key`.
3. **Deploy Schema**: Open your terminal in the root of the project:
   ```bash
   cd frontend
   npx supabase link --project-ref <your-production-project-ref>
   npx supabase db push
   ```
4. **Configure Authentication**: 
   - In Supabase, go to **Authentication > URL Configuration**.
   - Under **Site URL**, add the placeholder URL where your frontend will live (e.g., `https://cutandstyle.vercel.app`).
   - Under **Redirect URLs**, add `https://cutandstyle.vercel.app/**`.

---

## STEP 2: Backend API (Render.com)

The backend Express server handles secure tasks (RPC calls, admin endpoints) and needs to be hosted on a Node.js provider. [Render](https://render.com) is recommended.

1. **Push to GitHub**: Ensure your entire `backend` and `frontend` folders are pushed to a single GitHub repository.
2. **Create Web Service**: In Render, click "New Web Service" and connect your GitHub repo.
3. **Configure Service**:
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**: Add these exact variables in the Render dashboard:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://cutandstyle.vercel.app` *(Must match exactly what you use in Step 3 for CORS)*
   - `SUPABASE_URL` = *(From Step 1)*
   - `SUPABASE_ANON_KEY` = *(From Step 1)*
   - `SUPABASE_SERVICE_ROLE_KEY` = *(From Step 1)*
5. **Deploy**: Click Deploy. Once finished, Render will give you a URL (e.g., `https://cut-api.onrender.com`).

---

## STEP 3: Frontend Web App (Vercel)

The React/Vite frontend will be statically hosted on [Vercel](https://vercel.com) for maximum speed and global edge delivery.

1. **Create Project**: In Vercel, click "Add New Project" and import your GitHub repo.
2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_SUPABASE_URL` = *(From Step 1)*
   - `VITE_SUPABASE_ANON_KEY` = *(From Step 1)*
   - `VITE_API_URL` = `https://cut-api.onrender.com/api` *(The URL from Step 2)*
4. **Deploy**: Click Deploy. Vercel will build the frontend and provide your final live URL.

---

## STEP 4: Final Connection Checks

1. **CORS Validation**: Make sure Vercel's exact domain (`https://...vercel.app`) is set as the `FRONTEND_URL` in Render.
2. **Auth Validation**: Ensure Vercel's domain is the "Site URL" in Supabase Auth settings.
3. **Login Test**: Go to your Vercel URL, attempt to login with `admin@cutandstyle.com` / `admin123`. Try to create a worker and generate a test bill.

---

## STEP 5: Client Handover

Once the system is live and tested:

1. Provide the client with the **`CLIENT_HANDOVER.md`** document.
2. Guide them to log in as the Admin on their personal device.
3. Instruct them to go to the **Settings** page and change the default `admin123` password immediately.
4. Have them bookmark the Vercel URL on their salon's front-desk tablet/computer.
