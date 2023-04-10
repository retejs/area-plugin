import { ReteOptions } from 'rete-cli'
import sass from 'rollup-plugin-sass'

export default <ReteOptions>{
  input: 'src/index.ts',
  name: 'ReteAreaPlugin',
  plugins: [
    sass({
      insert: true
    })
  ],
  globals: {
    'rete': 'Rete'
  }
}
