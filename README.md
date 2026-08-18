# MoodBite AI 🍽️✨
> **Food Matched to How You Feel** — AI-Powered Emotional Dining & Delivery Experience

MoodBite AI is a full-stack food delivery web application that calibrates authentic culinary recommendations based on emotional psychology, appetite level, spice tolerance, dietary choices, and budget.

---

## 🌟 Key Features

- **🧠 AI Mood Calibration Engine**: Analyzes 10 emotional states (*Happy, Sad, Angry, Tired, Celebrating, Calm, Sick/Recovering, Late-Night Craving, Nostalgic Comfort, High Energy*) with empathy quotes, psychological flavor pairings, and catalog-grounded suggestions.
- **🤖 BiteBuddy AI Concierge**: Real-time conversational food assistant powered by `@google/genai` (with automated multi-model cascade & smart local fallback for 100% uptime).
- **🛒 Interactive Food Ordering**: Customization options (spice level, extra ghee/dips, portions), real-time promo code engine (`MOOD50`, `BITE20`, `FIRSTBITE`), and instant cart management.
- **📍 Live Order Tracking & Route Simulator**: 5-stage order pipeline (*Placed → Accepted → Cooking → Out for Delivery → Delivered*) with interactive delivery map and rider simulation.
- **📊 Customer Journey & Taste Profile**: Mood analytics charts, emotional dining history, and taste preference calibration.
- **🏢 Admin HQ & Relational DB Architecture**: Live operational KPI dashboard, order status pipeline controls, and PostgreSQL 16 DDL relational schema playground with GIN JSONB indexing.
- **🎨 Artisanal Typography & Design**: Humanized typography pairing **Fraunces** display serif with **Plus Jakarta Sans** body face.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Backend & Middleware**: Express.js, Vite Connect server proxy
- **AI / LLM Integration**: `@google/genai` SDK (`gemini-3.7-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite` fallback cascade)
- **Database Architecture**: PostgreSQL 16 Relational Schema with JSONB & Foreign Keys

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**

### 2. Installation
```bash
# Clone repository
git clone https://github.com/your-username/moodbite-ai.git

# Navigate to project directory
cd moodbite-ai

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 4. Development Server
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### 5. Production Build & Linting
```bash
# Type check and lint
npm run lint

# Build production bundle
npm run build
```

---

## 📜 License
MIT License
