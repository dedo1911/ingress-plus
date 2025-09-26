import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config: import('@sveltejs/kit').Config = {
	preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
}

export default config
