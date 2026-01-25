import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// Get git SHA, fallback to environment variable or undefined
const getGitSha = () => {
  try {
    // Try to get from git command
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // Fallback to environment variable (useful for Netlify)
    return process.env.VITE_GIT_SHA || process.env.COMMIT_REF?.substring(0, 7);
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgrPlugin(), VitePWA()],
  define: {
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(getGitSha()),
  },
});
