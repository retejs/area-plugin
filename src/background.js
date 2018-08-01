export class Background {
    constructor(editor, enable) {
        this.editor = editor;

        if (enable) 
            this.init();
    }

    init() {
        const el = document.createElement('div');

        el.innerHTML='hjk'
        el.className = 'background';

        this.editor.view.area.appendChild(el);
    }
}
