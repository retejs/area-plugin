import { Plugin as RetePlugin } from 'rete/types/core/plugin';
import { NodeEditor, Node } from 'rete';

export interface AreaPlugin extends RetePlugin {
  install: (editor: NodeEditor, options: {
    background?: boolean, // show background grid, default false
    snap?: boolean, // snap nodes to grid, default false
    scaleExtent?: true | {min: number, max: number} // restrict zoom min/max - setting to true will use defaults of min=0.1, max=1
    translateExtent?: true | {width: number, height: number} // restrict translation via width and height - setting to true will use defaults of width=5000, height=4000
  }) => void,
  zoomAt: (editor: NodeEditor, nodes?: Node[]) => void // zoom to centre of nodes
}
declare const _default: AreaPlugin;
export default _default;