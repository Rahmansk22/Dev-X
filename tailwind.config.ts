// tailwind.config.ts
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  theme: {
    fontFamily: {
      heading: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
      body: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
    },
    extend: {
      colors: {
        ...colors,
        background: '#111112',
        foreground: '#fff',
        primary: '#1db954',
        secondary: '#23272a',
      },
    },
  },
  plugins: [],
};

// // tailwind.config.js
// module.exports = {
//   // ...your existing config
//   theme: {
//     extend: {
//       animation: {
//         'grid': 'grid 15s linear infinite',
//       },
//       keyframes: {
//         'grid': {
//           '0%': { transform: 'translateY(-50%)' },
//           '100%': { transform: 'translateY(0)' },
//         },
//       },
//     },
//   },
//   plugins: [],
// };

  