type PointerHandler = (event: PointerEvent) => void
type PointerListenerHandlers = {
    down: PointerHandler
    move: PointerHandler
    up: PointerHandler
}

export type PointerListener = { destroy: () => void }

/**
 * listen to pointerdown, window's pointermove and pointerup events,
 * where last two not active before pointerdown triggered for performance reasons
 */
export function usePointerListener(element: HTMLElement, handlers: PointerListenerHandlers): PointerListener {
    const move: PointerHandler = (event) => {
        handlers.move(event)
    }
    const up: PointerHandler = (event) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        handlers.up(event)
    }
    const down: PointerHandler = (event) => {
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
        handlers.down(event)
    }

    element.addEventListener('pointerdown', down)

    return {
        destroy() {
            element.removeEventListener('pointerdown', down)
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', up)
        }
    }
}
