import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ramp derived from the brand primary #50104A (brand-600), holding
        // hue ~306° across the scale. Keep in sync with the other apps.
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
