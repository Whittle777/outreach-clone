/** @type {import('vite').UserConfig} */
module.exports = {
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['axios', 'papaparse'],
        },
      },
    },
  },
};
