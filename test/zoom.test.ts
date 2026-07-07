import { OnZoom, Zoom } from '../src/zoom'

const intensity = 0.1

const DOM_DELTA_PIXEL = 0
const DOM_DELTA_LINE = 1
const DOM_DELTA_PAGE = 2

class TestableZoom extends Zoom {
  public setup(element: HTMLElement, onzoom: OnZoom) {
    this.element = element
    this.onzoom = onzoom
  }

  public triggerWheel(event: Partial<WheelEvent>) {
    this.wheel(event as WheelEvent)
  }
}

function createWheelEvent(overrides: Partial<WheelEvent> = {}): Partial<WheelEvent> {
  return {
    deltaY: 0,
    deltaMode: 0,
    clientX: 50,
    clientY: 50,
    preventDefault: jest.fn(),
    ...overrides
  }
}

function createHolder(): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  } as unknown as HTMLElement
}

function triggerWheel(deltaY: number, deltaMode: number) {
  const onzoom = jest.fn()
  const zoom = new TestableZoom(intensity)

  zoom.setup(createHolder(), onzoom)
  zoom.triggerWheel(createWheelEvent({ deltaY, deltaMode }))

  return onzoom
}

describe('Zoom wheel handler', () => {
  describe('mouse-like wheel zoom', () => {
    const cases = [
      { name: 'Chrome wheel down', deltaY: 120, deltaMode: DOM_DELTA_PIXEL, expected: -intensity },
      { name: 'Chrome wheel up', deltaY: -120, deltaMode: DOM_DELTA_PIXEL, expected: intensity },
      { name: 'Firefox wheel down', deltaY: 1, deltaMode: DOM_DELTA_LINE, expected: -intensity },
      { name: 'Firefox wheel up', deltaY: -1, deltaMode: DOM_DELTA_LINE, expected: intensity },
      { name: 'page scroll down', deltaY: 1, deltaMode: DOM_DELTA_PAGE, expected: -intensity }
    ]

    cases.forEach(({ name, deltaY, deltaMode, expected }) => {
      it(name, () => {
        const onzoom = triggerWheel(deltaY, deltaMode)

        expect(onzoom).toHaveBeenCalledWith(
          expected,
          expect.any(Number),
          expect.any(Number),
          'wheel'
        )
      })
    })
  })

  describe('touchpad wheel zoom', () => {
    const cases = [
      { name: 'pinch light', deltaY: 0.05, expected: -0.000625 },
      { name: 'pinch medium', deltaY: 0.5, expected: -0.00625 },
      { name: 'pinch strong', deltaY: 3, expected: -0.0375 }
    ]

    cases.forEach(({ name, deltaY, expected }) => {
      it(name, () => {
        const onzoom = triggerWheel(deltaY, DOM_DELTA_PIXEL)

        expect(onzoom).toHaveBeenCalledWith(
          expect.closeTo(expected),
          expect.any(Number),
          expect.any(Number),
          'wheel'
        )
      })
    })
  })

  describe('zero deltaY', () => {
    it('ignores horizontal wheel and gesture end', () => {
      const onzoom = triggerWheel(0, DOM_DELTA_PIXEL)

      expect(onzoom).not.toHaveBeenCalled()
    })
  })

  describe('small discrete wheel delta', () => {
    it('uses proportional step below mouse cap threshold', () => {
      const onzoom = triggerWheel(4, DOM_DELTA_PIXEL)

      expect(onzoom).toHaveBeenCalledWith(
        expect.closeTo(-0.05),
        expect.any(Number),
        expect.any(Number),
        'wheel'
      )
    })
  })

  it('calls preventDefault on wheel', () => {
    const onzoom = jest.fn()
    const zoom = new TestableZoom(intensity)
    const event = createWheelEvent({ deltaY: 120 })

    zoom.setup(createHolder(), onzoom)
    zoom.triggerWheel(event)

    expect(event.preventDefault).toHaveBeenCalled()
  })
})
