# IS-Sahayak — Verified Indian Standards (BIS) & Tender Compliance Engine

**Smart India Hackathon (SIH) Problem Statement 26108**

IS-Sahayak recommends current, verified Indian Standards (BIS) and companion standards (`Test`, `Terms`, `Safety`, `Install`) for procurement descriptions in **English, Hindi, or Hinglish**, audits draft tender documents line-by-line, and supports translation into **all 22 Scheduled Indian Languages**.

---

## How to Deploy the Exact Google AI Studio App on Render.com

### Step 1: Push Your Code to GitHub
1. Click the **GitHub (Export / Save to GitHub)** icon in the top bar of **Google AI Studio** to push this workspace directly to a new GitHub repository (e.g. `is-sahayak`).

### Step 2: Deploy on Render (`render.com`)
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in with your **GitHub** account.
2. Click **New +** → **Web Service**.
3. Connect and select your **`is-sahayak`** GitHub repository.
4. Use these exact settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or Starter)
5. *(Optional)* Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - *(Translation across all 22 Indian languages works automatically out of the box without any API key; if you also want the Gemini fallback tier active, you can optionally add `GEMINI_API_KEY`).*
6. Click **Create Web Service**.
   - Render will build the Vite frontend (`dist/`) and start `server.ts` on Render's assigned `$PORT`, serving the full UI (**Simple Mode + Expert Mode + 22 Indian Languages**) and all REST endpoints (`/healthz`, `/v1/recommend`, `/v1/audit`, `/v1/standards/:id`, `/api/translate`).

---

## How to Push to GitHub & Deploy on Streamlit Community Cloud

### Step 1: Push to GitHub
You can push this repository to GitHub in two ways:
1. **Directly from Google AI Studio**: Click the **GitHub / Export** icon in the top bar of AI Studio to create or push to a GitHub repository.
2. **Or via the Download Bundle**:
   - Switch to **Expert** mode in the top-right header and click **Download Streamlit Bundle (.zip)** in the left sidebar (or clone/download this workspace).
   - Unzip and push to your GitHub repo:
     ```bash
     git init
     git add .
     git commit -m "Initial commit: IS-Sahayak Simple + Expert Mode"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<your-repo>.git
     git push -u origin main
     ```

### Step 2: Deploy on Streamlit Community Cloud
1. Go to **[share.streamlit.io](https://share.streamlit.io/)** and sign in with your **GitHub** account.
2. Click **Create app** (or **New app**).
3. Select your GitHub repository:
   - **Repository**: `<your-username>/<your-repo>`
   - **Branch**: `main`
   - **Main file path**: `streamlit_app.py`
4. Click **Deploy!**
   - Streamlit Cloud will automatically read `requirements.txt` and `data/raw/*` from the repository root and launch `streamlit_app.py` in ~30 seconds.
   - No API keys are required for Streamlit Cloud deployment.

---

## Running Locally

### Option A: Run the Python Streamlit App
```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

### Option B: Run the Full-Stack Web App + REST API (`server.ts`)
```bash
npm install
npm run dev
```
