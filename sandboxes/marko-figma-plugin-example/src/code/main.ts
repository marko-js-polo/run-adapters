// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
import { handlers } from './handlers/index.js';
import { handleRouteIndex } from './handlers/route-index.js';

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string; [key: string]: any }) => {
  console.log('📫 Received message:', JSON.stringify(msg, null, 2));
  const handler = handlers[msg.type];

  if (handler) {
    handler(msg);
  } else {
    console.error('Unknown message type:', msg.type);
  }
};

handleRouteIndex();