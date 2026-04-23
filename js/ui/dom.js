export function clearNode(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function el(tag, options = {}) {
  const node = document.createElement(tag);
  const { className, text, html, attrs = {}, style = {}, dataset = {} } = options;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (html !== undefined) node.innerHTML = html;

  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(key, value);
  });

  Object.entries(style).forEach(([key, value]) => {
    node.style[key] = value;
  });

  Object.entries(dataset).forEach(([key, value]) => {
    node.dataset[key] = value;
  });

  return node;
}
