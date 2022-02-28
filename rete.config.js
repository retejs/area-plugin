import typescript from '@rollup/plugin-typescript';
import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.ts',
    name: 'AreaPlugin',
    plugins: [
        sass({
            insert: true
        }),
        typescript()
    ],
    babelPresets: [
        require('@babel/preset-typescript')
    ]
}