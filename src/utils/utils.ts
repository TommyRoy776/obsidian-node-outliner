export function resizeNode(nodeEl: HTMLElement, canvas: any) {
  const contentEl = nodeEl.querySelector(
    ".markdown-preview-view, .cm-scroller"
  ) as HTMLElement | null;
  if (!contentEl) return;

  // Measure content size
  const style = getComputedStyle(contentEl);
  const paddingX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const paddingY =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  const newWidth = contentEl.scrollWidth + paddingX;
  const newHeight = contentEl.scrollHeight + paddingY;

  // Apply size to DOM
  nodeEl.style.width = `${newWidth}px`;
  nodeEl.style.height = `${newHeight}px`;

  // Update JSON so it persists
  const id = nodeEl.getAttribute("data-node-id");
  if (id && canvas.nodes[id]) {
    canvas.nodes[id].width = newWidth;
    canvas.nodes[id].height = newHeight;
    canvas.requestSave();
  }
}