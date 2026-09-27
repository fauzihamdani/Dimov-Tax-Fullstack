# Project Dashboard

A web dashboard for managing and tracking projects. Built with Next.js and Supabase, with an AI chat assistant for querying project data in natural language.

## Features

- Project list with search, filter, and sort
- Stats overview (charts and summary numbers)
- Export data to CSV, PDF, and XLSX
- Dark mode and light mode
- Google OAuth login via Supabase
- AI chat assistant to ask questions about project data (e.g. "show on hold projects", "projects assigned to Fauzi")

## Tech Stack

- **Frontend:** Next.js, TailwindCSS
- **Auth & Database:** Supabase (Postgres, OAuth)
- **AI Agent:** Python, FastAPI, LangGraph, Groq
- **Deployment:** Vercel (frontend), AWS EC2 with Docker + Nginx (AI agent backend)

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- A Groq API key (for the AI agent)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root folder:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_AGENT_API_URL=your_ai_agent_api_url
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to Use

1. **Sign in** using your Google account.
2. **View projects** on the dashboard. Use the filter bar to search by name, status, member, or deadline.
3. **Check stats** on the overview page for a summary of project status and progress.
4. **Export data** by clicking the export button and choosing CSV, PDF, or XLSX.
5. **Ask the AI assistant** by clicking the chat icon in the corner. Type a question like "how many completed projects" or "on hold projects assigned to Fauzi" and the assistant will fetch and summarize the data. Results can be exported directly to Excel from the chat.
6. **Toggle dark/light mode** using the icon in the header.

## AI Agent

The AI assistant only answers questions related to project data. It cannot insert, update, or delete records, and it does not answer unrelated questions. All data comes directly from the database through a read-only connection, so it will not make up information.

## Project Structure

```
app/               Next.js app router pages
components/        Reusable UI components
lib/               Supabase client and helper functions
public/            Static assets
```

## Deployment

The frontend is deployed on Vercel and redeploys automatically on every push to `main`. The AI agent backend runs in a Docker container on an AWS EC2 instance, behind Nginx with HTTPS.

## Docker

Build and run the frontend in a container:

docker build -t nextjs-app .
docker run -p 3000:3000 --env-file .env.local nextjs-app

Environment variables prefixed with NEXT_PUBLIC_ are baked into the build at build time, not read at runtime. If you change any NEXT_PUBLIC_ variable, rebuild the image before running it again.

Requires output: "standalone" in next.config.ts.

## License

This project is for internal/educational use.