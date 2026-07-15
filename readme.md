<div align="center">

<img src="https://img.shields.io/badge/RiskView-Safety%20First-red?style=for-the-badge&logo=shield&logoColor=white" alt="RiskView" width="300"/>

# 🛡️ RiskView

### *Your Community-Powered Travel Safety Companion*

**Stay aware. Stay safe. Travel smart.**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

<br/>

> 🌍 **RiskView** is a mobile application that empowers travelers with real-time, community-driven safety intelligence — helping you navigate unfamiliar places with confidence.

<br/>

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square)](/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](/)
[![Author](https://img.shields.io/badge/Author-Karthik%20Paila-purple?style=flat-square)](/)

</div>

---

## 📌 Table of Contents

- [🚨 The Problem](#-the-problem)
- [💡 The Solution](#-the-solution)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [📡 API Endpoints](#-api-endpoints)
- [📁 Project Structure](#-project-structure)
- [🚀 Current Status](#-current-status)
- [🔮 Future Improvements](#-future-improvements)
- [👤 Author](#-author)

---

## 🚨 The Problem

When traveling to unfamiliar places, most people are completely unaware of:

| ⚠️ Risk Type | Description |
|---|---|
| 🎭 **Common Scams** | Tourist traps, fake services, and deceptive schemes |
| 🏚️ **Unsafe Areas** | Neighborhoods with elevated crime or danger |
| 🚗 **Dangerous Roads** | Hazardous routes and traffic black spots |
| 👁️ **Suspicious Activity** | Local threats that aren't covered by guidebooks |

> 💬 *Most travel apps prioritize attractions and restaurants — not your **safety**.*
> RiskView was built to change that.

---

## 💡 The Solution

RiskView provides a **community-driven safety platform** where every traveler becomes a contributor to a shared safety network.

<div align="center">

```
👤 Travelers Report  →  📍 Map Displays Risks  →  🤖 AI Analyzes Data  →  🔔 You Stay Safe
```

</div>

**With RiskView, you can:**

- 🗺️ View nearby safety reports pinned on a live map
- 📝 Submit reports about scams or dangerous situations you encounter
- 👍 Vote on reports to surface the most reliable warnings
- 🔔 Receive automatic alerts when entering risky zones
- 🤖 Get AI-generated summaries of local safety conditions
- ❓ Ask natural language questions like *"Is this area safe at night?"*

---

## ✨ Key Features

### 📍 Location-Based Reports
> See what's happening around you — right now.

Reports are displayed on an interactive map based on your current location. Each pin represents a real incident reported by a fellow traveler, covering:
- 🎭 Scams & fraud
- ⚠️ Dangerous zones
- 🚨 Active safety issues

---

### 📣 Community Reporting
> Your experience protects the next traveler.

Submit detailed incident reports with:

```
📌 Location       →  Exact coordinates of the incident
🏷️ Category       →  Scam or Danger
📋 Title          →  Short summary of the event
📄 Description    →  Full account of what happened
```

---

### 🗳️ Voting System
> Crowd-sourced reliability filtering.

Every report can be **upvoted ✅** or **downvoted ❌** by the community.  
This surfaces trustworthy reports and buries inaccurate ones — keeping the platform reliable.

---

### 🚗 Travel Mode
> Hands-free, continuous safety monitoring.

Enable Travel Mode and RiskView watches your back automatically:

- 🔄 Fetches nearby reports **every 30 seconds**
- 🔔 Sends **push notifications** when multiple hazards are detected nearby
- 📡 Works in the background while you explore

---

### 🤖 AI-Assisted Safety Insights

Powered by **LangChain + Groq LLM (`meta-llama/llama-4-maverick-17b-128e-instruct`)**

#### 🔍 Category Validation
AI cross-checks whether your report's description actually matches your chosen category — reducing noise and improving data quality.

#### 📊 Safety Summary
Generate an instant AI-written briefing of all nearby incidents. Get the big picture in seconds before stepping into unfamiliar territory.

#### 💬 RAG Question System
Ask anything about a location:
```
"Are there any scams near this market?"
"Is it safe to walk here at night?"
"What should I watch out for in this area?"
```
The AI retrieves relevant nearby reports and crafts a **context-aware answer** just for you.

---

### 🆘 Emergency Assistance
> Help is always one tap away.

The map surfaces **nearby emergency services** including:

- 🏥 Hospitals
- 🚔 Police Stations

Quick-access emergency contacts are always visible when you need them most.

---

## 🏗️ Architecture

RiskView follows a clean **three-tier architecture**:

```
┌─────────────────────────────────────────┐
│         📱 Mobile Client                │
│     React Native + Expo                 │
└──────────────┬──────────────────────────┘
               │  HTTP / REST API
┌──────────────▼──────────────────────────┐
│         ⚙️  Backend API                 │
│     Node.js + Express + MongoDB         │
└──────────────┬──────────────────────────┘
               │  Internal Service Calls
┌──────────────▼──────────────────────────┐
│         🤖 AI Service                   │
│   Python + FastAPI + LangChain + Groq   │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

<details>
<summary><b>📱 Mobile Application</b></summary>

<br/>

| Technology | Purpose |
|---|---|
| ![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB) | Cross-platform mobile framework |
| ![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white) | Development & build toolchain |
| ![TailwindCSS](https://img.shields.io/badge/NativeWind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Utility-first styling |
| ![Redux](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat&logo=redux&logoColor=white) | Global state management |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) | HTTP client |
| 🗺️ React Native Maps | Interactive map rendering |
| 📍 Expo Location | GPS & geolocation access |
| 🧭 React Navigation | Screen routing & navigation |

</details>

<details>
<summary><b>⚙️ Backend API</b></summary>

<br/>

| Technology | Purpose |
|---|---|
| ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white) | Server runtime |
| ![Express](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express) | REST API framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white) | NoSQL database |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat) | MongoDB ODM |
| 🔐 JWT | Stateless authentication |
| 🔒 bcrypt | Password hashing |

</details>

<details>
<summary><b>🤖 AI Service</b></summary>

<br/>

| Technology | Purpose |
|---|---|
| ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) | Service language |
| ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi) | High-performance API framework |
| 🦜 LangChain | LLM orchestration |
| 🔎 FAISS | Vector similarity search |
| 🤗 HuggingFace Embeddings | Text vectorization |
| ⚡ Groq LLM | Ultra-fast AI inference |

**Model:** `meta-llama/llama-4-maverick-17b-128e-instruct`

</details>

## 📁 Project Structure

```
riskview/
│
├── 📱 client/
│   └── React Native Expo mobile application
│
├── ⚙️  server/
│   └── Node.js Express backend API
│
├── 🤖 ml-service/
│   └── Python FastAPI AI analysis service
│
└── 📄 README.md
```

---

## 🚀 Current Status

> 🟡 **Active Development**

The following components are currently being finalized for deployment:

| Component | Status |
|---|---|
| ⚙️ Backend API | 🔄 Deployment Pending |
| 🤖 AI Service | 🔄 Deployment Pending |
| 📱 Mobile App Build | 🔄 Deployment Pending |

> 📌 Deployment instructions will be added once hosting is finalized.

---

## 🔮 Future Improvements

Exciting features on the roadmap:

| Feature | Description |
|---|---|
| 🏅 **Trust Scoring** | Dynamic credibility scores for frequent reporters |
| 🛡️ **Spam Detection** | Advanced AI filtering of false or duplicate reports |
| 🗺️ **Advanced Map Visualization** | Heatmaps, clusters, and risk zone overlays |
| 🌐 **Multilingual Support** | Reports and AI responses in multiple languages |
| 📈 **Safety Trend Analysis** | Historical patterns and predictive risk insights |

---

## 👤 Author

<div align="center">

### Karthik Paila

*Engineering student focused on building software systems that solve real-world problems.*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/)

</div>

---

<div align="center">

**⭐ If RiskView helps you travel safer, consider giving it a star!**

*Made with ❤️ for safer travels around the world*

</div>
