# 🐙 RepoLens

**RepoLens** is a modern, lightweight, fully client-side React application that allows developers to perform deep comparative analysis of multiple GitHub repositories simultaneously. 

Tired of opening 10 different tabs to compare commit dates, stargazers, forks, and language distributions? RepoLens solves this by presenting all the crucial metrics in one unified, pixel-perfect dashboard that faithfully replicates GitHub's official Primer Design System.

## ✨ Features

- **Multi-Repo Comparison:** Compare up to 10 repositories by default (with an optional infinite mode).
- **Pixel-Perfect GitHub UI:** Built with Tailwind CSS, strictly following GitHub's Primer UI guidelines.
- **Dynamic Theming:** Seamlessly switch between System, Light, and Dark (GitHub Dimmed) modes.
- **No Backend Required:** 100% Client-Side. No databases, no paid APIs. Ready to be deployed as a static site.
- **Sharable Links:** Your selected repositories are synced to the URL, making it easy to share comparisons with your team.
- **Visual Analytics:** Interactive charts for Commit Activity (last 3 months) and Language Distribution powered by Recharts.
- **API Rate Limit Bypass:** Includes a secure local input for your GitHub Personal Access Token (PAT) to bypass unauthenticated rate limits.

## 🚀 Tech Stack

- **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Icons:** [@primer/octicons-react](https://primer.style/octicons/)
- **Charts:** [Recharts](https://recharts.org/)

## 🛠️ Quick Start

You will need [Node.js](https://nodejs.org/) installed to run this project locally.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/repolens.git
   cd repolens
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🌐 Deployment

This project includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) for seamless deployment to **GitHub Pages**. 

Simply push the code to your `main` branch, ensure GitHub Pages is set to use "GitHub Actions" in your repository settings, and the site will be built and published automatically!

## 📜 License

This project is licensed under the [MIT License](LICENSE).
