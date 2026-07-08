import neostandard from 'neostandard'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'

export default [
  {
    ignores: ['build/**', '.svelte-kit/**', 'package/**', 'static/**']
  },
  ...neostandard(),
  ...svelte.configs.recommended,
  {
    rules: {
      'svelte/no-at-html-tags': 'off'
    }
  },
  {
    files: ['src/service-worker.js'],
    languageOptions: {
      globals: { ...globals.serviceworker }
    }
  }
]
