export class Background {
    constructor(editor, element) {
        if (!element) return;
        const el = element instanceof HTMLElement ? element : document.createElement('div');
     
        el.classList += ` rete-background ${element === true ? 'default' : ''}`;
        el.addEventListener('click', e => editor.trigger({e, container: editor.view.container}));
        
        editor.view.area.appendChild(el);
    }
}
