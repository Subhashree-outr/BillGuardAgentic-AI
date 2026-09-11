# BillGuard Agentic AI

BillGuard is a full-stack web application designed to track, manage, and analyze bills using an Agentic AI approach. 

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Motion (Framer Motion), Lucide React
- **Backend:** Node.js, Express, SQLite, Google GenAI (`@google/genai`)
- **Language:** TypeScript

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory and ensure you configure any necessary environment variables (such as API keys for Google GenAI).

3. **Run the application:**
   ```bash
   npm run dev
   ```
   This command starts the full-stack development server. By default, it will be accessible at `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Starts the development server using `tsx`.
- `npm run build`: Builds the Vite frontend and bundles the Express backend using `esbuild`.
- `npm run start`: Runs the compiled production server.
- `npm run clean`: Cleans up the `dist` directory.
- `npm run test`: Runs the test suite.

## Project Structure
- `/src`: Frontend React components and application logic.
- `/server`: Backend Express routes, AI agents, and database logic.
- `/backend`: Python backend components (if applicable).