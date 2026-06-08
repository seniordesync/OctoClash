<div align="center">
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="Logo" width="80" height="80">

  <h1 align="center">OctoClash</h1>

  <p align="center">
    <strong>The ultimate tool to compare GitHub repositories side-by-side with beautiful charts and data.</strong>
    <br />
    <br />
    <a href="https://seniordesync.github.io/OctoClash">View Live Demo</a>
    ·
    <a href="https://github.com/seniordesync/OctoClash/issues">Report Bug</a>
    ·
    <a href="https://github.com/seniordesync/OctoClash/issues">Request Feature</a>
  </p>

  <p align="center">
    <a href="https://github.com/seniordesync/OctoClash/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/seniordesync/OctoClash.svg?style=for-the-badge" alt="License" />
    </a>
    <a href="https://github.com/seniordesync/OctoClash/stargazers">
      <img src="https://img.shields.io/github/stars/seniordesync/OctoClash.svg?style=for-the-badge" alt="Stars" />
    </a>
    <a href="https://github.com/seniordesync/OctoClash/network/members">
      <img src="https://img.shields.io/github/forks/seniordesync/OctoClash.svg?style=for-the-badge" alt="Forks" />
    </a>
  </p>
</div>

<br />

<!-- SCREENSHOT -->
<div align="center">
  <img src="https://placehold.co/1000x500/0d1117/c9d1d9?text=Insert+Awesome+Screenshot+Here" alt="OctoClash Dashboard" width="100%">
  <p><em>Replace this placeholder with an actual screenshot of the OctoClash dashboard.</em></p>
</div>

<br />

## 🌟 About The Project

Have you ever been torn between two or more open-source libraries? **OctoClash** solves that by allowing you to compare any GitHub repositories against each other in real-time. Simply drag and drop repositories into the arena to view deep insights into their popularity, commit activity, language stack, and community engagement.

Built with a stunning, GitHub-inspired Dark/Light theme, it provides developers with the ultimate analytical dashboard to make informed decisions about the tools they use.

### ✨ Key Features

- **🏆 Dynamic Leaderboards**: See exactly who is winning across categories like Popularity (Stars), Activity (Commits), Community (Forks), and Update Frequency.
- **📈 Real-Time Charts**: Interactive area, line, and pie charts showcasing Star Growth History and Commit Activity over the last 12 weeks.
- **💻 Tech Stack Breakdown**: Visual representation of the programming languages used in each repository with precise byte calculations.
- **⚡️ GitHub API Integration**: Bypasses limits using custom Personal Access Tokens, while aggressively caching responses locally for instant re-loads.
- **🎨 Primer Design System**: A pixel-perfect implementation of GitHub's native styling (Primer UI) with seamless Dark and Light modes.

---

## 🛠️ Built With

This project is built using modern web development standards and optimized for performance.

*   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="16px"> **[React (Vite)](https://react.dev/)** - Core frontend framework
*   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-plain.svg" width="16px"> **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
*   🐻 **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
*   📊 **[Recharts](https://recharts.org/)** - Composable charting library
*   🐙 **[@primer/octicons](https://primer.style/octicons/)** - Official GitHub icons

---

## 🚀 Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

*   npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/seniordesync/OctoClash.git
   ```
2. Install NPM packages
   ```sh
   cd OctoClash
   npm install
   ```
3. Start the development server
   ```sh
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`

> [!TIP]
> **API Limits:** If you are comparing many repositories at once, you might hit GitHub's unauthenticated API rate limit (60 requests/hour). Click the 🔑 Key icon in the header to add your own GitHub Personal Access Token (PAT) and increase your limit to 5,000 requests/hour!

---

## 🛣️ Roadmap

- [x] Initial React Application Setup
- [x] Basic GitHub API Integration
- [x] Drag & Drop Comparison Table
- [x] Advanced Charts (Star Growth, Commits)
- [x] Leaderboards & Rankings
- [ ] Automated CI/CD Deployment to GitHub Pages

See the [open issues](https://github.com/seniordesync/OctoClash/issues) for a full list of proposed features (and known issues).

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
