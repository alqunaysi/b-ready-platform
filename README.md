# B‑Ready Assessment Platform

This repository contains a full‑stack web application that implements the World Bank’s **Business Ready** “Business Entry” assessment.  It includes:

* **Backend (`backend`)** – a Node.js/Express API written in TypeScript that exposes authentication, assessment management, question hierarchy, answer submission and scoring endpoints.  It uses PostgreSQL as the database and requires a `DATABASE_URL` and `JWT_SECRET` environment variables.
* **Frontend (`frontend`)** – a React application (Vite + TypeScript) that allows users to register/login, start and resume assessments, answer questions in the proper hierarchy and view final scores.
* **Database schema (`schema.sql`)** – SQL definitions for creating tables.
* **Data population (`populate.sql`)** – SQL insert statements to populate the database with the official B‑Ready questions, topics, pillars, categories and subcategories.

## Deployment overview

Because this environment cannot access external hosting providers directly, deployment must be performed from your own machine or hosting account.  The following is a recommended sequence using [Railway](https://railway.app) (other providers like Render, Fly.io or a self‑hosted server will work too):

1. **Create a GitHub repository** and push the contents of this project to it.  Make sure `backend`, `frontend`, `schema.sql`, `populate.sql` and `questions.json` are included.
2. **Sign up for a Railway account** (using GitHub, Google or email) and create a new project.
3. From your Railway project dashboard:
   - **Provision a PostgreSQL database** via the “Add Plugin” → “PostgreSQL” option.  After creation, copy the connection string (`postgresql://user:password@host:port/dbname`) and set it as `DATABASE_URL` in your service.
   - Add a secret named `JWT_SECRET` with a long random value (e.g., generated via `openssl rand -hex 32`).
   - Create a new **Service** → “Deploy from Repository”, select your GitHub repo and choose the `backend` directory as the root.  Set the start command to `npm run build && npm run start`.  Railway will install dependencies, build the TypeScript, apply environment variables and start the API.
   - In the project settings, configure **Health Checks** or **Exposed Ports** as needed; the Express app listens on port 3000 by default.
4. **Run the database migrations**:  From the Railway dashboard’s database plugin, open a SQL console and run the contents of `schema.sql` followed by `populate.sql` to set up tables and seed data.
5. Deploy the **frontend** separately:
   - Build the React app locally: run `cd frontend && npm install && npm run build`, which produces a `dist` folder with static files.
   - You can host these files on any static hosting service (Railway Static, Netlify, Vercel, or even GitHub Pages).  Configure the frontend to proxy API requests to your Railway backend URL.  In `frontend/vite.config.ts` the proxy points to `http://localhost:3000` for development; in production you should update the `baseURL` in `src/api.ts` or configure a reverse proxy so `/api` resolves correctly.
   - Upload the `dist` directory to your static hosting provider and note the resulting URL.
6. **Finalise URL**:  When both backend and frontend are deployed, update the frontend configuration (if necessary) so that API requests go to the deployed backend.  You will then have a single public URL where users can register, login and perform assessments.

## Local development

If you wish to run the application locally, you’ll need Node.js (v18+), PostgreSQL and npm.  After cloning the repo:

```bash
# Set up the database (assumes PostgreSQL is installed and running)
createdb bready
psql -d bready -f schema.sql
psql -d bready -f populate.sql

# Backend
cd backend
npm install
export DATABASE_URL=postgresql://user:password@localhost:5432/bready
export JWT_SECRET="someverysecuresecret"
npm run dev

# Frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

By default, the backend will run on port 3000 and the frontend on port 5173 with a development proxy to the backend.

## Questions / Support

If you encounter issues during deployment or usage, please review the project structure and ensure environment variables are correctly set.  The backend logs (in Railway or your hosting platform) will help diagnose connection or migration problems.