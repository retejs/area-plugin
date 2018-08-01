
import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.js',
    name: 'AreaPlugin',
    plugins: [
        sass({
            insert: true
        })
    ]
}