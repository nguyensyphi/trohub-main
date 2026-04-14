/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      width: {
        main: "min(1100px, 100%)",
      },
      keyframes: {
        blink: {
          "0%": {
            opacity: 0.5,
          },
          "50%": {
            opacity: 1,
            transform: "translateY(-4px);",
          },
          "100%": {
            opacity: 0.5,
          },
        },
      },
      animation: {
        "blink-0": "blink 1s linear 0s infinite",
        "blink-0.2": "blink 1s linear 0.2s infinite",
        "blink-0.4": "blink 1s linear 0.4s infinite",
      },
    },
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      bungee: ["Bungee Shade", "sans-serif"],
      quicksand: ["Quicksand", "sans-serif"],
    },
    boxShadow: {
      soft: "0 1px 3px hsl(222 47% 11% / 0.06), 0 8px 24px hsl(222 47% 11% / 0.06)",
    },
  },
  plugins: [require("tailwindcss-animate")],
}
