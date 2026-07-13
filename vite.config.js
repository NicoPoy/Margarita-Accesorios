import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bannersDir = path.join(__dirname, 'public', 'banners');
const manifestPath = path.join(bannersDir, 'manifest.json');
const imageExtensions = new Set(['.avif', '.gif', '.jpg', '.jpeg', '.png', '.webp']);

function getBannerManifest() {
  if (!fs.existsSync(bannersDir)) return [];

  return fs
    .readdirSync(bannersDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((fileName) => ({
      src: `/banners/${fileName}`,
      alt: fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim() || 'Banner Margarita Accesorios'
    }));
}

function writeBannerManifest() {
  fs.mkdirSync(bannersDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(getBannerManifest(), null, 2)}\n`);
}

function bannerManifestPlugin() {
  return {
    name: 'banner-manifest',
    buildStart() {
      writeBannerManifest();
    },
    configureServer(server) {
      server.middlewares.use('/banners/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(getBannerManifest()));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), bannerManifestPlugin()]
});