import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['.nuxt', '.output', 'dist', 'coverage', 'node_modules']
})