declare const parent: {
  postMessage: (msg: { pluginMessage: object }, targetOrigin: string) => void;
};

export function sendMessage(type: string, data?: Record<string, unknown>) {
  const pluginMessage = { type, data };
  console.log('📮 Sending message:', JSON.stringify(pluginMessage, null, 2));
  parent.postMessage({pluginMessage}, '*');
}
