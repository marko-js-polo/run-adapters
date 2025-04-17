/**
 * Shows the about UI.
 */
export function handleRouteAbout(): void {
  figma.showUI(__uiFiles__.about, { themeColors: true, width: 600, height: 600 });
} 