import { Restrictor } from './restrictor';
import { zoomAt } from './zoom-at';

function install(editor, params) {
    params.scaleExtent = params.scaleExtent || { min: 0.1, max: 1 };
    params.translateExtent = params.translateExtent || { width: 2000, height: 1000 };

    const restrictor = new Restrictor(editor, params.scaleExtent, params.translateExtent)
}    

export default {
    install,
    zoomAt
}