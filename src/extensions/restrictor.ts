import { BaseSchemes } from 'rete'

import { AreaPlugin } from '..'
import { Position } from '../types'

type ScaleRange = { min: number, max: number }
type TranslateRange = { left: number, top: number, right: number, bottom: number }

/**
 * Restrictor extension parameters
 */
export type Params = {
  /** The scaling range */
  scaling?: ScaleRange | (() => ScaleRange) | boolean
  /** The translation range */
  translation?: TranslateRange | (() => TranslateRange) | boolean
}

/**
 * Restrictor extension. Restricts the area zoom and position
 * @param plugin The area plugin
 * @param params The restrictor parameters
 * @listens zoom
 * @listens zoomed
 * @listens translated
 */
export function restrictor<Schemes extends BaseSchemes, K>(plugin: AreaPlugin<Schemes, K>, params?: Params) {
  const scaling = params?.scaling
    ? params.scaling === true ? { min: 0.1, max: 1 } : params.scaling
    : false
  const translation = params?.translation
    ? params.translation === true ? { left: 0, top: 0, right: 1000, bottom: 1000 } : params.translation
    : false

  function restrictZoom(zoom: number) {
    if (!scaling) throw new Error('scaling param isnt defined')
    const { min, max } = typeof scaling === 'function' ? scaling() : scaling

    if (zoom < min) {
      return min
    } else if (zoom > max) {
      return max
    }
    return zoom
  }

  // eslint-disable-next-line max-statements
  function restrictPosition(position: Position): Position {
    if (!translation) throw new Error('translation param isnt defined')
    const nextPosition = { ...position }
    const { left, top, right, bottom } = typeof translation === 'function'
      ? translation()
      : translation

    if (nextPosition.x < left) {
      nextPosition.x = left
    }
    if (nextPosition.x > right) {
      nextPosition.x = right
    }
    if (nextPosition.y < top) {
      nextPosition.y = top
    }
    if (nextPosition.y > bottom) {
      nextPosition.y = bottom
    }

    return nextPosition
  }

  plugin.addPipe(context => {
    if (!context || typeof context !== 'object' || !('type' in context)) return context
    if (scaling && context.type === 'zoom') {
      return {
        ...context,
        data: {
          ...context.data,
          zoom: restrictZoom(context.data.zoom)
        }
      }
    }
    if (translation && context.type === 'zoomed') {
      const position = restrictPosition(plugin.area.transform)

      plugin.area.translate(position.x, position.y)
    }
    if (translation && context.type === 'translate') {
      return {
        ...context,
        data: {
          ...context.data,
          position: restrictPosition(context.data.position)
        }
      }
    }
    return context
  })
}
