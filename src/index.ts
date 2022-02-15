import './style.sass';
import { NodeEditor } from 'rete';
import { Background } from './background';
import { Restrictor, ScaleExtentType, TranslateExtentType } from "./restrictor";
import { SnapGrid, SnapParam } from "./snap";
import { zoomAt } from './zoom-at';

type Params = {
    background?: HTMLElement | true;
    snap?: SnapParam;
    scaleExtent?: ScaleExtentType | true;
    translateExtent?: TranslateExtentType | true;

}

function install(editor: NodeEditor, params: Params) {
    let background = params.background || false;
    let snap = params.snap || false;
    let scaleExtent = params.scaleExtent || false;
    let translateExtent = params.translateExtent || false;

    if (background) {
        new Background(editor, background);
    }
    if (scaleExtent || translateExtent) {
        new Restrictor(editor, scaleExtent, translateExtent)
    }
    if (snap) {
        new SnapGrid(editor, snap);
    }
}    

export default {
    name: "area-plugin",
    install,
    zoomAt
}