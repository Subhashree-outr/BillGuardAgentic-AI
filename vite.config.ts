import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'BillGuardAgentic-AI';
  const isUserSite = repository.endsWith('.github.io');

  return {
    plugins: [react(), tailwindcss()],
    base: isGitHubPages && !isUserSite ? `/${repository}/` : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
