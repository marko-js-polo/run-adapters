import { handleClose } from './close.js';
import { handleCreateShapes } from './create-shapes.js';
import { handleRouteAbout } from './route-about.js';
import { handleRouteIndex } from './route-index.js';

/**
 * A dictionary mapping message types to their handler functions.
 */
export const handlers: Record<string, (msg: any) => void> = {
  'cmd:close': handleClose,
  'cmd:create-shapes': handleCreateShapes,
  'route:about': handleRouteAbout,
  'route:index': handleRouteIndex,
}; 