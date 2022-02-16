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

const install = (context: NodeEditor | any, options?: Params | any): void => {
    if (!options) return;

    if (options.background) {
        new Background(context, options.background);
    }
    if (options.scaleExtent || options.translateExtent) {
        new Restrictor(context, options.scaleExtent, options.translateExtent)
    }
    if (options.snap) {
        new SnapGrid(context, options.snap);
    }
}    

export default {
    name: "area-plugin",
    install,
    zoomAt
}