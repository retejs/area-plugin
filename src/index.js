const min = (arr) => Math.min(...arr);
const max = (arr) => Math.max(...arr);

function nodesBBox(editor, nodes) {
    const left = min(nodes.map(node => node.position[0]));
    const top = min(nodes.map(node => node.position[1]));
    const right = max(nodes.map(node => node.position[0] + editor.view.nodes.get(node).el.clientWidth));
    const bottom = max(nodes.map(node => node.position[1] + editor.view.nodes.get(node).el.clientHeight));
    
    return {
        left,
        right,
        top,
        bottom,
        width: Math.abs(left - right),
        height: Math.abs(top - bottom),
        getCenter: () => {
            return [
                (left + right) / 2,
                (top + bottom) / 2
            ];
        }
    };
}

function zoomAt(editor, nodes = editor.nodes) {
    const bbox = nodesBBox(editor, nodes);
    const [x, y] = bbox.getCenter();
    const [w, h] = [editor.view.container.clientWidth, editor.view.container.clientHeight];
    const { area } = editor.view;

    var [kw, kh] = [w / bbox.width, h / bbox.height]
    var k = Math.min(kh * 0.9, kw * 0.9, 1);

    area.transform.x = area.container.clientWidth / 2 - x * k;
    area.transform.y = area.container.clientHeight / 2 - y * k;
    area.zoom(k, 0, 0);
    
    area.update();
}

function install(editor, params) {
    params.scaleExtent = params.scaleExtent || { min: 0.1, max: 1 };
    params.translateExtent = params.translateExtent || { width: 2000, height: 1000 };

    editor.on('zoom', data => {
        const se = params.scaleExtent;
        const tr = data.transform;

        if (data.zoom < se.min)
            data.zoom = se.min;
        else if (data.zoom > se.max)
            data.zoom = se.max;
    });

    editor.on('translate', data => {
        const te = params.translateExtent;
        const k = data.transform.k;
        const kw = te.width * k;
        const kh = te.height * k;
        const cx = editor.view.container.clientWidth / 2;
        const cy = editor.view.container.clientHeight / 2;

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
    });
}    

export default {
    install,
    zoomAt
}