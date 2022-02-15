
import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.ts',
    name: 'AreaPlugin',
    plugins: [
        sass({
            insert: true
        })
    ],
    babelPresets: [
        require('@babel/preset-typescript')
    ],
    extensions: ['.js', '.ts']
}