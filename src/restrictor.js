export class Restrictor {
    constructor(editor, scaleExtent, translateExtent) {
        this.editor = editor;
        this.scaleExtent = scaleExtent;
        this.translateExtent = translateExtent;

        editor.on('zoom', this.restrictZoom.bind(this));
        editor.on('translate', this.restrictTranslate.bind(this));
    }

    restrictZoom(data) {
        const se = this.scaleExtent;
        const tr = data.transform;

        if (data.zoom < se.min)
            data.zoom = se.min;
        else if (data.zoom > se.max)
            data.zoom = se.max;
    }

    restrictTranslate(data) {
        const te = this.translateExtent;
        const { container } = this.editor.view;
        const k = data.transform.k;
        const [kw, kh] = [te.width * k, te.height * k];
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