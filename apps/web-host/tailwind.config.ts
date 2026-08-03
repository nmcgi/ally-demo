import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // The remote modules are compiled from workspace source into this app
    // (see REMOTE_MODULES in next.config.js), so their classes have to be
    // scanned here too — otherwise anything they use that the host doesn't
    // (fixed, z-50, bg-gradient-to-br, …) never reaches the stylesheet.
    '../web-accounts/src/**/*.{js,ts,jsx,tsx}',
    '../web-loans/src/**/*.{js,ts,jsx,tsx}',
    '../web-admin/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ramp derived from the brand primary #50104A (brand-600), holding
        // hue ~306° across the scale. Keep the four apps' palettes in sync —
        // the host compiles remote sources but each app has its own config.
        brand: {
          50: '#fbeffa',
          100: '#f6daf3',
          200: '#ecb7e6',
          300: '#da81d0',
          400: '#ab2b9d',
          500: '#731769',
          600: '#50104a',
          700: '#3f0b39',
          800: '#30082b',
          900: '#22071f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
