# RiskView

RiskView is a mobile application that helps travelers stay aware of scams and safety risks in unfamiliar locations.

The platform allows users to view nearby safety reports, submit new reports, and receive AI-generated insights about local safety conditions.

Unlike traditional travel apps that focus mainly on attractions or accommodations, RiskView focuses on **community-driven safety awareness**.

---

## Problem

When people travel to unfamiliar places they often do not know about:

- common scams
- unsafe areas
- dangerous roads
- suspicious local activities

Most travel applications prioritize **tourism information**, not **traveler safety**.

As a result, travelers may unknowingly enter unsafe situations.

RiskView addresses this by allowing travelers to **share real experiences and warnings with others**.

---

## Solution

RiskView provides a community-driven platform where travelers can:

- view nearby safety reports on a map
- report scams or dangerous situations
- vote on reports to indicate reliability
- receive alerts when entering risky areas
- view AI summaries of nearby incidents
- ask safety-related questions about a location

This helps travelers make **more informed and safer decisions**.

---

## Key Features

### Location Based Reports

Users can view reports within a nearby radius based on their current location.

Reports include:

- scams
- dangerous areas
- safety issues

---

### Community Reporting

Users can submit reports describing incidents they experienced.

Each report contains:

- location
- category (scam or danger)
- title
- description

---

### Voting System

Users can upvote or downvote reports.

Voting helps identify reports that are more reliable.

---

### Travel Mode

Travel Mode automatically checks for nearby reports.

When enabled:

- nearby reports are fetched every 30 seconds
- users receive notifications if multiple reports appear nearby

---

### AI Assisted Safety Insights

RiskView includes an AI service that analyzes reports.

#### Category Validation

AI checks whether the report description matches the selected category.

This helps reduce incorrect reports.

---

#### Safety Summary

Users can generate a summary of nearby reports.

This helps travelers quickly understand the overall safety situation.

---

#### RAG Question System

Users can ask questions such as:

- "Is this area safe at night?"
- "Are there scams near this place?"

The system retrieves nearby reports and generates answers based on them.

---

### Emergency Assistance

The map also displays nearby emergency services including:

- hospitals
- police stations

Users can quickly access emergency contacts if needed.

---

## Architecture

The system consists of three main components.

Mobile Client (React Native + Expo)
↓
Backend API (Node.js + Express + MongoDB)
↓
AI Service (Python + FastAPI + LangChain + Groq)


---

## Technology Stack

### Mobile Application

- React Native
- Expo
- NativeWind (TailwindCSS)
- Redux Toolkit
- Axios
- React Navigation
- Expo Location
- React Native Maps

---

### Backend API

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

---

### AI Service

- Python
- FastAPI
- LangChain
- FAISS
- HuggingFace Embeddings
- Groq LLM

Model used:


meta-llama/llama-4-maverick-17b-128e-instruct


---

## API Endpoints

### Authentication


POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
PUT /api/auth/update-push-token


### Reports


GET /api/reports/nearby
GET /api/reports
GET /api/reports/:id
POST /api/reports
POST /api/reports/:id/upvote
POST /api/reports/:id/downvote
DELETE /api/reports/:id


### Notifications


GET /api/notifications
GET /api/notifications/unread/count
PUT /api/notifications/:id/read
PUT /api/notifications/read/all
DELETE /api/notifications/:id


### AI Services


POST /api/ml/validate-category
POST /api/ml/summarize-all
POST /api/ml/ask-rag


---

## Project Structure


riskview
│
├── client
│ └── React Native Expo mobile application
│
├── server
│ └── Node.js Express backend API
│
├── ml-service
│ └── Python FastAPI AI analysis service
│
└── README.md


---

## Current Status

The project is currently under development.

Deployment of the following components is planned:

- Backend API
- AI service
- Mobile application build

Deployment instructions will be added once hosting is completed.

---

## Future Improvements

Possible future enhancements include:

- trust scoring for reports
- spam detection improvements
- advanced map visualization
- multilingual support
- safety trend analysis

---

## Author

Karthik Paila

Engineering student focused on building software systems that solve real-world problems.