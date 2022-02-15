import { Node, NodeEditor } from "rete";

export type SnapParam = { size: number, dynamic: boolean }
export class SnapGrid {
    editor: NodeEditor;
    size: number;
    constructor(editor: NodeEditor, params: SnapParam) {
        this.editor = editor;
        this.size = params.size;

        if (params.dynamic)
            this.editor.on('nodetranslate', this.onTranslate.bind(this))
        else
            this.editor.on('rendernode', ({ node, el }) => {
                el.addEventListener('mouseup', this.onDrag.bind(this, node));
                el.addEventListener('touchend', this.onDrag.bind(this, node));
                el.addEventListener('touchcancel', this.onDrag.bind(this, node));
            });
    }

    onTranslate(data: {
        node: Node;
        x: number;
        y: number;
    }) {
        const { x, y } = data;

        data.x = this.snap(x);
        data.y = this.snap(y);
    }

    onDrag(node: Node) {
        const [ x, y ] = node.position;

        node.position[0] = this.snap(x);
        node.position[1] = this.snap(y);
        
        const nodeInstance = this.editor.view.nodes.get(node);
        if (nodeInstance) {
            nodeInstance.update()
        }
        this.editor.view.updateConnections({ node });
    }
    
    snap(value: number) {
        return Math.round(value/this.size) * this.size;
    }
}