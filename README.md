# PrepForge

PrepForge is a comprehensive interview preparation platform that allows users to solve coding problems, save notes, track progress, and schedule spaced-repetition revisions.

This repository contains both the frontend client and backend server for the application.

## Repository Structure

- `prepforge-client/`: The frontend application built with React, TypeScript, and Vite.
- `prepforge-server/`: The backend server built with Node.js, Express, and MongoDB.
- `assets/`: Contains project assets such as screenshots.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd prepforge-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by copying `.env.example` to `.env` and updating the values.
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd prepforge-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- **Authentication:** Secure user registration and login.
- **Problem Solving:** Interactive Monaco editor with problem descriptions and submission handling.
- **Dashboard & Analytics:** Track solved problems, achievements, and goals.
- **Spaced Repetition:** Schedule revisions to efficiently review difficult problems.
- **Global Search:** Command palette to search for problems, notes, and bookmarks.
- **Import/Export:** Download your progress as JSON or ZIP archives.
