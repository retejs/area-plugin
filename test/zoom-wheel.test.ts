import {
  computeWheelZoomDelta,
  LINE_HEIGHT_PX,
  PAGE_HEIGHT_PX,
  wheelDeltaToPixels
} from '../src/zoom-wheel'

const intensity = 0.1

const DOM_DELTA_PIXEL = 0
const DOM_DELTA_LINE = 1
const DOM_DELTA_PAGE = 2

function signBasedWheelDelta(deltaY: number): number {
  if (deltaY === 0) return 0

  return -intensity * Math.sign(deltaY)
}

function wheelZoomDelta(deltaY: number, deltaMode: number): number {
  const pixels = wheelDeltaToPixels(deltaY, deltaMode)

  return computeWheelZoomDelta(pixels, intensity)
}

describe('wheelDeltaToPixels', () => {
  it('returns delta unchanged in DOM_DELTA_PIXEL mode', () => {
    expect(wheelDeltaToPixels(120, DOM_DELTA_PIXEL)).toBe(120)
    expect(wheelDeltaToPixels(0.05, DOM_DELTA_PIXEL)).toBe(0.05)
    expect(wheelDeltaToPixels(-3, DOM_DELTA_PIXEL)).toBe(-3)
  })

  it('multiplies by line height in DOM_DELTA_LINE mode', () => {
    expect(wheelDeltaToPixels(1, DOM_DELTA_LINE)).toBe(LINE_HEIGHT_PX)
    expect(wheelDeltaToPixels(-2, DOM_DELTA_LINE)).toBe(-2 * LINE_HEIGHT_PX)
  })

  it('multiplies by page height in DOM_DELTA_PAGE mode', () => {
    expect(wheelDeltaToPixels(1, DOM_DELTA_PAGE)).toBe(PAGE_HEIGHT_PX)
    expect(wheelDeltaToPixels(-1, DOM_DELTA_PAGE)).toBe(-PAGE_HEIGHT_PX)
  })
})

describe('mouse-like wheel zoom', () => {
  const cases = [
    { name: 'Chrome wheel down', deltaY: 120, deltaMode: DOM_DELTA_PIXEL, expected: -intensity },
    { name: 'Chrome wheel up', deltaY: -120, deltaMode: DOM_DELTA_PIXEL, expected: intensity },
    { name: 'Firefox wheel down', deltaY: 1, deltaMode: DOM_DELTA_LINE, expected: -intensity },
    { name: 'Firefox wheel up', deltaY: -1, deltaMode: DOM_DELTA_LINE, expected: intensity },
    { name: 'page scroll down', deltaY: 1, deltaMode: DOM_DELTA_PAGE, expected: -intensity }
  ]

  cases.forEach(({ name, deltaY, deltaMode, expected }) => {
    it(`${name} matches sign-based delta`, () => {
      const delta = wheelZoomDelta(deltaY, deltaMode)

      expect(delta).toBe(expected)
      expect(delta).toBe(signBasedWheelDelta(deltaY))
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
    it(`${name} scales proportionally`, () => {
      const delta = wheelZoomDelta(deltaY, DOM_DELTA_PIXEL)

      expect(delta).toBeCloseTo(expected)
      expect(delta).not.toBe(signBasedWheelDelta(deltaY))
    })
  })
})

describe('zero deltaY', () => {
  it('ignores horizontal wheel and gesture end', () => {
    expect(wheelZoomDelta(0, DOM_DELTA_PIXEL)).toBe(0)
    expect(wheelZoomDelta(0, DOM_DELTA_PIXEL)).toBe(signBasedWheelDelta(0))
  })
})

describe('small discrete wheel delta', () => {
  it('uses proportional step below mouse cap threshold', () => {
    const delta = wheelZoomDelta(4, DOM_DELTA_PIXEL)

    expect(delta).toBeCloseTo(-0.05)
    expect(delta).not.toBe(signBasedWheelDelta(4))
  })
})
