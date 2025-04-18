/**
 * @param msg The message object containing the count of shapes to create.
 * @param msg.count The number of rectangles to create.
 */
export function handleCreateShapes(msg: { count: number }): void {
  const numberOfRectangles = msg.count;

  const nodes: SceneNode[] = [];

  console.log('⚙️ Creating', msg.count, 'shapes');

  for (let i = 0; i < numberOfRectangles; i++) {
    const rect = figma.createRectangle();
    rect.x = i * 150;
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
    figma.currentPage.appendChild(rect);
    nodes.push(rect);
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
} 