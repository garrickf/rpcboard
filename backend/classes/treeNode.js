/** treeNode.js
 * 
 * A TreeNode has null (root) or a Span as its value, and as its children, links
 * to TreeNodes which follow it on the call graph (i.e., RPC B follows A if A
 * calls B).
 */

class TreeNode {
  constructor(span) {
    this.span = span || null;
    this.children = [];
  }

  isRoot() {
    return this.span === null;
  }

  addChild(treeNode) {
    this.children.push(treeNode);
  }

  getChildren() {
    return this.children;
  }

  getSpan() {
    return this.span;
  }
}

// Usage: const TreeNode = require("./classes/treeNode");
module.exports = TreeNode;
