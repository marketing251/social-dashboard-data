import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        text: 'hsl(var(--text))',
        'text-muted': 'hsl(var(--text-muted))',
        accent: 'hsl(var(--accent))',
        green: 'hsl(var(--green))',
        red: 'hsl(var(--red))',
        warning: 'hsl(var(--warning))',
        twitter: '#1da1f2',
        instagram: '#e1306c',
        facebook: '#1877f2',
        youtube: '#ff0000',
        tiktok: '#00f2ea',
        linkedin: '#0a66c2',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
