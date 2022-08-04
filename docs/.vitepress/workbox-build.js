const { generateSW } = require('workbox-build');

const swDest = './dist/service-worker.js'

generateSW({
  // mode: 'development',
  swDest,
  globDirectory: './dist',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  sourcemap: false,
  dontCacheBustURLsMatching: /\.\w{8}\.([^.]*|lean.js)$/,
  globPatterns: ['**\/*.{js,css,png,jpg,jpeg,gif,svg,woff,woff2,eot,ttf,otf}', 'index.html'],
  runtimeCaching: [
    {
      urlPattern: /https:\/\/(cdn|at|prismjs|kit|fonts|ka)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'code-notes-vitepress-dependency-cdn',
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 30,
        }
      }
    },
  ]
}).then(({ count, size }) => {
  console.log(`Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`);
});