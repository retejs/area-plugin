import { NodeEditor } from "rete";

export type ScaleExtentType = {min: number, max: number};
export type TranslateExtentType = { width: number, height: number };
type TranslateParam = {x: number, y: number, transform: {k: number}}
type ZoomParam = { zoom: number }

export class Restrictor {
    editor: NodeEditor
    scaleExtent: ScaleExtentType | undefined
    translateExtent: TranslateExtentType | undefined
    constructor(editor: NodeEditor, scaleExtent: ScaleExtentType | undefined | boolean, translateExtent: TranslateExtentType | undefined | boolean) {
        this.editor = editor;
        if (scaleExtent) {
            this.scaleExtent = scaleExtent === true ? { min: 0.1, max: 1 } : scaleExtent;
            editor.on('zoom', this.restrictZoom.bind(this));
        }

        if (translateExtent) {
            this.translateExtent = translateExtent === true ? {
                width: 5000,
                height: 4000
            } : translateExtent;
            editor.on('translate', this.restrictTranslate.bind(this));
        }
    }

    restrictZoom(data: ZoomParam) {
        if (data.zoom < this.scaleExtent!.min)
            data.zoom = this.scaleExtent!.min;
        else if (data.zoom > this.scaleExtent!.max)
            data.zoom = this.scaleExtent!.max;
    }

    restrictTranslate(data: TranslateParam) {
        const { container } = this.editor.view;
        const k = data.transform.k;
        const [kw, kh] = [this.translateExtent!.width * k, this.translateExtent!.height * k];
        const cx = container.clientWidth / 2;
        const cy = container.clientHeight / 2;

        data.x -= cx;
        data.y -= cy;
        
        if (data.x > kw)
            data.x = kw;
        else if (data.x < - kw)
            data.x = - kw;
        
        if (data.y > kh)
            data.y = kh;
        else if (data.y < - kh)
            data.y = - kh;
        
        data.x += cx;
        data.y += cy;
    }
}