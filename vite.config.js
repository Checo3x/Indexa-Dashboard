export default {
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
        outDir: 'dist'
    }
}
