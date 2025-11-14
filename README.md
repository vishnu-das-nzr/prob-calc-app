# 🎲 Probability Calculator (React)

A simple and interactive probability calculator built with **React**.  
It allows users to calculate:

- **Combined Probability** → `P(A) * P(B)`
- **Either Probability** → `P(A) + P(B) - P(A)P(B)`

The app includes client-side validation and communicates with a backend API (C#/.NET) to compute results.

---

## ▶️ Running the Project

### **Install dependencies**
```bash
npm install

Start development server
npm start

Run unit tests
npm test

API Endpoints Used
POST /api/probabilities/combinedwith
POST /api/probabilities/either

Body:
{
  "probabilityA": 0.5,
  "probabilityB": 0.2
}

