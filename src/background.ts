import { NodeEditor } from "rete";

export class Background {
    constructor(editor: NodeEditor, element: HTMLElement | true) {
        const el = element instanceof HTMLElement ? element : document.createElement('div');

        el.classList.add("rete-background")
        if (element === true)
            el.classList.add("default")
        el.addEventListener('click', () => editor.trigger('click', editor.view.container));
        
        editor.view.area.appendChild(el);
    }
}
