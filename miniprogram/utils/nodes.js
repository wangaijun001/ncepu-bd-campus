/**
 * rich-text nodes 工具
 */

/** nodes → 纯文本 */
function nodesToText(nodes) {
  if (!nodes) return '';
  if (typeof nodes === 'string') return nodes;
  let s = '';
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type === 'text') s += n.text;
    else if (n.name === 'br') s += ' ';
    else if (n.children) s += nodesToText(n.children);
  }
  return s;
}

module.exports = { nodesToText };
