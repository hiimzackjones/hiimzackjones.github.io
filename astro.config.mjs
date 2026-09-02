// @ts-check
import { defineConfig } from 'astro/config';
import { mehhspaceCodeTheme } from './src/styles/code-theme.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://mehhspace.com',
  // No `base` needed — the custom domain serves from the root.
  markdown: {
    shikiConfig: {
      // Site-palette theme instead of Shiki's default dark editor colors.
      theme: mehhspaceCodeTheme,
      // `null` = Shiki adds NO inline overflow styles, so global.css owns the
      // scrolling. The scroll container has to be the inner <code>, not <pre>,
      // or the language bar would slide out of view on long lines.
      wrap: null,
    },
  },
});
