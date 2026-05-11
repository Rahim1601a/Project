import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: [
    'react', 
    'react-dom', 
    '@mui/material', 
    '@mui/icons-material', 
    '@tanstack/react-table',
    '@tanstack/react-virtual',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    'jspdf',
    'jspdf-autotable',
    'xlsx',
    'react-select',
    'react-flatpickr',
    'clsx',
    'tailwind-merge'
  ],
});
