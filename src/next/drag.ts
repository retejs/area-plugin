import { listenWindow } from './utils'

export class Drag {

    pointerStart: [number, number] | null;
    destroy: () => void;

    constructor(
      private el: HTMLElement,
      private onStart: (e: PointerEvent) => void,
      private onTranslate: (dx: number, dy: number, e: PointerEvent) => void,
      private onDrag: (e: PointerEvent) => void
    ) {
        this.pointerStart = null;
        this.el = el;

        this.el.style.touchAction = 'none';
        this.el.addEventListener('pointerdown', this.down.bind(this));

        const destroyMove = listenWindow('pointermove', this.move.bind(this));
        const destroyUp = listenWindow('pointerup', this.up.bind(this));

        this.destroy = () => { destroyMove(); destroyUp(); }
    }

    down(e: PointerEvent) {
        if ((e.pointerType === 'mouse') && (e.button !== 0)) return;
        e.stopPropagation();
        this.pointerStart = [e.pageX, e.pageY]

        this.onStart(e);
    }

    move(e: PointerEvent) {
        if (!this.pointerStart) return;
        e.preventDefault();

        const [x, y] = [e.pageX, e.pageY]

        const delta = [x - this.pointerStart[0], y - this.pointerStart[1]];

        const zoom = this.el.getBoundingClientRect().width / this.el.offsetWidth;

        this.onTranslate(delta[0] / zoom, delta[1] / zoom, e);
    }

    up(e: PointerEvent) {
        if (!this.pointerStart) return;

        this.pointerStart = null;
        this.onDrag(e);
    }
}
