# TravelCopilot AI ✈️

TravelCopilot is an advanced, AI-powered travel itinerary generator and trip management dashboard. It creates custom, day-by-day travel itineraries based on your preferences and helps you manage your packing checklist and travel budget all in one place.

## ✨ Features
- **AI Itinerary Generation:** Instantly generate complete travel plans by simply describing your dream trip.
- **Trip Dashboard:** A beautiful, iPhone-inspired glassmorphism UI to view all your planned trips.
- **Smart Checklist:** Track your preparation progress with auto-generated tasks and custom non-negotiables.
- **Receipts & Budget Tracker:** Upload softcopies of your receipts and manage your travel budget to ensure you stay on track.
- **Inspiration Gallery:** Discover beautiful dream destinations to spark your next adventure.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Vanilla CSS
- **Backend:** Node.js, Express
- **AI Integration:** OpenAI API / Gemini API

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine
- An API Key for AI generation

### Installation & Setup

1. **Configure the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory (use `.env.example` as a template) and add your API keys.

2. **Configure the Frontend:**
   ```bash
   cd frontend
   npm install
   ```

### Running the App Locally
You can start both the frontend and backend simultaneously using the provided Windows batch script:
```bash
./start.bat
```

Alternatively, you can run them separately in two different terminal windows:
- **Backend:** `cd backend && npm run dev` (Runs on http://localhost:5000)
- **Frontend:** `cd frontend && npm run dev` (Runs on http://localhost:5173)

Once both servers are running, open **http://localhost:5173** in your browser to start planning your next adventure!
