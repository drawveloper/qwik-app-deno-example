import { defineConfig } from 'vite';
import { qwikRollup } from '@builder.io/qwik/optimizer';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

const isServerBuild = !!process.argv.find(a => a === 'server/build')
console.log('Server build', isServerBuild)

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'q-[hash].js',
        assetFileNames: 'q-[hash].[ext]',
      },
    },
  },
  publicDir: false,
  ssr: {
    noExternal: true,
  },
  plugins: [
    qwikRollup({
      srcDir: resolve('./src'),
      entryStrategy: {
        type: 'single',
      },
      symbolsOutput: (data) => {
        // Skip symbols on SSR build
        if (isServerBuild) {
          return
        }
        outputJSON('./server/q-symbols.json', data);
        console.log('./server/q-symbols.json generated.')
      },
    }),
  ],
});

async function outputJSON(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}
