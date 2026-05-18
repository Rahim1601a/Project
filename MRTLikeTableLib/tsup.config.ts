import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: [
    'react', 
    'react-dom', 
    '@emotion/react',
    '@emotion/styled',
    '@mui/material', 
    '@mui/icons-material', 
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    'jspdf',
    'jspdf-autotable',
    'react-select',
    'react-flatpickr',
    'clsx',
    'tailwind-merge',
    '@mescius/spread-sheets',
    '@mescius/spread-excelio'
  ],
});
