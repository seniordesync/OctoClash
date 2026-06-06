<div align="center">
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" width="100" />
  <h1 align="center">🐙 OctoClash</h1>
  <p align="center">
    <strong>The Ultimate GitHub Repository Comparison Dashboard</strong>
    <br />
    <br />
    <a href="https://seniordesync.github.io/OctoClash/"><strong>🚀 View Live Demo</strong></a>
    <br />
    <br />
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-blue.svg?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF.svg?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/100%25_Client_Side-Success-success.svg?style=for-the-badge" alt="100% Client Side" />
</p>

---

## 🎯 What is OctoClash?

**OctoClash** is a modern, ultra-fast, and deeply analytical React application that allows developers to perform real-time comparative analysis of multiple GitHub repositories simultaneously.

Tired of opening 10 different tabs to compare commit dates, stargazers, forks, and language distributions? OctoClash solves this by presenting all crucial metrics in one unified, pixel-perfect dashboard that faithfully replicates GitHub's official Primer Design System.

<br />

## ✨ Core Features

### 🔍 Deep Analytical Comparison
- **Multi-Repo Dashboard:** Compare repositories side-by-side. View detailed stats including stars, forks, issues, recent activity, and repository size.
- **Smart Autocomplete:** Live-search GitHub repositories with instant results, keyboard navigation, and immediate star-count feedback.
- **Drag & Drop Organization:** Beautifully arrange your compared repositories using a fluid, physics-based drag-and-drop interface.

### 📊 Visual Data & Charts
- **Star History:** Track and compare the historical growth of repositories with sampled line charts.
- **Commit Activity:** See the pulse of a project with 3-month commit activity graphs.
- **Language Distribution:** Visual bar charts comparing the tech stacks and byte-sizes of the selected codebases.
- **Top Contributors:** Instantly view the most active developers driving each project forward.

### 🎨 Pixel-Perfect GitHub UX
- **Primer UI:** Designed strictly following GitHub's official Primer Design System for a seamless, native feel.
- **Dynamic Theming:** Instant switching between System, Light, and the sleek GitHub Dark Dimmed modes.

### ⚡ Performance & Sharing
- **100% Client-Side:** No backend, no databases, no hidden telemetry.
- **Smart Caching:** Local memory caching ensures you never hit GitHub API rate limits unnecessarily.
- **Shareable Links:** Your exact comparison state is synced to the URL. Copy the link and share it instantly with your team.

<br />

## 🛠️ Technology Stack

We believe in a modern, lightweight, and incredibly fast stack:

*   **Core:** React 18 & Vite
*   **Styling:** Tailwind CSS (with bespoke GitHub Primer variables)
*   **State Management:** Zustand (with URL and localStorage persistence)
*   **Data Visualization:** Recharts
*   **Interactions:** @dnd-kit (for accessible drag and drop)
*   **Icons:** @primer/octicons-react

<br />

## 🔐 Privacy & API Limits

OctoClash communicates directly with the public GitHub REST API from your browser. We do not track, store, or proxy any of your requests. 

For heavy usage, you can optionally provide a **Personal Access Token (PAT)** via the secure settings menu. This token is stored exclusively in your browser's local storage and is never transmitted anywhere except directly to `api.github.com`.

---

<div align="center">
  <p>Built with ❤️ for the open-source community.</p>
</div>
