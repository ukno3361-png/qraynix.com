import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    base: '/admin/',
    root: path.resolve(__dirname),
    plugins: [react()],
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        minify: false,
    },
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000',
            '/auth': 'http://localhost:3000',
            '/uploads': 'http://localhost:3000',
        },
    },
});
