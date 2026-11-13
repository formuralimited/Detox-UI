import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds one self-contained index.html (JS, CSS and fonts inlined).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false, chunkSizeWarningLimit: 4000 },
});
