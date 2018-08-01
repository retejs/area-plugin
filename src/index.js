import './style.sass';
import { Background } from './background';
import { Restrictor } from './restrictor';
import { SnapGrid } from './snap';
import { zoomAt } from './zoom-at';

function install(editor, params) {
    params.background = params.background || false;
    params.snap = params.snap || { size: 16, dynamic: true };
    params.scaleExtent = params.scaleExtent || { min: 0.1, max: 1 };
    params.translateExtent = params.translateExtent || { width: 2000, height: 1000 };

    const background = new Background(editor, params.background);
    const restrictor = new Restrictor(editor, params.scaleExtent, params.translateExtent)
    const snap = new SnapGrid(editor, params.snap);
}    

export default {
    install,
    zoomAt
}