/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          default: 'var(--color-canvas-default)',
          subtle: 'var(--color-canvas-subtle)',
          inset: 'var(--color-canvas-inset)',
        },
        border: {
          default: 'var(--color-border-default)',
          muted: 'var(--color-border-muted)',
        },
        fg: {
          default: 'var(--color-fg-default)',
          muted: 'var(--color-fg-muted)',
          accent: 'var(--color-fg-accent)',
          danger: 'var(--color-fg-danger)',
          success: 'var(--color-fg-success)',
        },
        btn: {
          bg: 'var(--color-btn-bg)',
          border: 'var(--color-btn-border)',
          hoverBg: 'var(--color-btn-hover-bg)',
          primaryBg: 'var(--color-btn-primary-bg)',
          primaryHoverBg: 'var(--color-btn-primary-hover-bg)',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
