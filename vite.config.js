import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'public', // Especificamos que la raíz del proyecto es la carpeta 'public'
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'https://api.indexacapital.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    build: {
        outDir: '../dist', // Ajustamos el directorio de salida para que sea relativo a la raíz del proyecto
        emptyOutDir: true // Asegura que el directorio de salida se limpie antes de compilar
    },
    publicDir: false // Deshabilitamos el directorio público predeterminado porque ya estamos usando 'public' como raíz
});