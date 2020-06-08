/** treeGenerator.js
 *
 * The TreeGenerator is the next step after the Spanner. It takes spans and
 * attempts to match and nest them into a hierarchical call graph--who called
 * what. By getting this profile of execution, we can pretty-print the results,
 * or pass it along to our front end visualization.
 */

// TODO: tree generator needs to keep a list of Span objects
// idea: place span into a priority queue ordered by Client_send_initial_meta
// timestamp

const EventEmitter = require("events").EventEmitter;

const TreeNode = require("./classes/treeNode");
const { EVENT_TYPES } = require("./eventTypes");
const { TRANSPORT_OPS, ROLES } = require("./constants");

class TreeGenerator extends EventEmitter {
  constructor(spanner) {
    super();
    this.tree = null; // TODO: make n-ary tree node
    this.allSpans = [];
    this.spanner = spanner;

    this.spanner.onSpanCreation((span) => this._handleSpanCreation(span));
  }

  /** Start the spanner, which starts the attached parsers */
  start() {
    this.spanner.start();
  }

  onTreeUpdate(cb) {
    this.on(EVENT_TYPES.TREE_UPDATE, cb);
  }

  prettyPrintSelf() {
    // Navigate through nodes of tree and print self, and children
    this._prettyPrint(this.tree, 0); // TODO: change tree name to root
  }

  _prettyPrint(treeNode, indentLevel) {
    const indent = `    `.repeat(indentLevel);
    const span = treeNode.getSpan();
    console.log(`${indent}span: ${span ? "" : "(root)"}`);
    if (!!span) this._prettyPrintSpan(span, indentLevel);
    console.log(`${indent}children: ${treeNode.getChildren().length ? "" : "(none)"}`);
    treeNode.getChildren().forEach((childNode) => {
      this._prettyPrint(childNode, indentLevel + 1);
    });
  }

  _prettyPrintSpan(span, indentLevel) {
    const indent = `    `.repeat(indentLevel + 1);
    console.log(
      `${indent}client (TID ${span.getClientThreadId()}) sends RPC ${span.getPath()} at ${span
        .getStart()
        .toNSString()}`
    );
    console.log(`${indent}destination node: ${span.getAuthority()}`);
    console.log(
      `${indent}server (TID ${span.getServerThreadId()}) recvs at ${span
        .getServerStart()
        .toNSString()}`
    );
    console.log(
      `${indent}server (TID ${span.getServerThreadId()}) sends reply at ${span
        .getServerEnd()
        .toNSString()}`
    );
    console.log(
      `${indent}client (TID ${span.getClientThreadId()}) recvs reply at ${span
        .getEnd()
        .toNSString()}`
    );
  }

  toJSON() {
    return JSON.stringify(this.tree);
  }

  _emitTreeUpdate() {
    this.emit(EVENT_TYPES.TREE_UPDATE, this.tree);
  }

  /** Internal helper that  */
  _handleSpanCreation(span) {
    this.allSpans.push(span);
    this._updateTree();
    this._emitTreeUpdate();
  }

  /** Builds tree from scratch every time (TODO: could be optimized) */
  _updateTree() {
    // Assemble spans into a call graph tree. Match TID's and server/client time

    // Build a lookup table to facilitate building the tree
    const clientThreadIdToSpans = {};

    this.allSpans.forEach((span) => {
      const clientThreadId = span.getClientThreadId();

      // Initialize with empty list
      if (!clientThreadIdToSpans.hasOwnProperty(clientThreadId)) {
        clientThreadIdToSpans[clientThreadId] = [];
      }

      // Add to lookup table
      clientThreadIdToSpans[clientThreadId].push(span);
    });

    // Note: JS is garbage-collected
    // Create root node (base of tree)
    this.tree = new TreeNode();

    this.allSpans.forEach((span) => {
      if (this.tree.children.length === 0) {
        // If no children, just add to root node
        this.tree.addChild(new TreeNode(span));
      } else {
        // Recursively decide where to insert, starting from root
        this._treeInsert(this.tree, span);
      }
    });
  }

  // Helper functions
  _treeInsert(treeNode, span) {
    // span is the span we wish to insert
    treeNode.children.forEach((candidateNode, idx) => {
      const candidateSpan = candidateNode.getSpan();

      if (this._isChildOf(candidateSpan, span)) {
        // span is strict parent of candidateSpan
        const newNode = new TreeNode(span);
        newNode.addChild(candidateNode);

        treeNode.children.splice(idx, 1); // Remove candidate span ref
        treeNode.addChild(newNode);
        return;
      }

      if (this._isDescendantOf(candidateSpan, span)) {
        // span is loose parent of candidateSpan
        const newNode = new TreeNode(span);
        newNode.addChild(candidateNode);

        treeNode.children.splice(idx, 1); // Remove candidate span ref
        treeNode.addChild(newNode);
        return;
      }

      if (this._isChildOf(span, candidateSpan)) {
        // span is strict child of candidateSpan
        // Place into candidateSpan's children
        candidateNode.addChild(new TreeNode(span));
        return;
      }

      if (this._isDescendantOf(span, candidateSpan)) {
        // If descendant: search children recursively
        this._treeInsert(candidateNode, span);
        return;
      }

      // None of the above: place into current level (children)
      treeNode.addChild(new TreeNode(span));
    });
  }

  /** Returns whether span is the parent of candidate span */
  _isParentOf(span, candidateSpan) {
    const threadIdsMatch =
      candidateSpan.getClientThreadId() === span.getServerThreadId();
    const clientCallInBounds =
      span.hasTimestampInServerRange(candidateSpan.getStart()) &&
      span.hasTimestampInServerRange(candidateSpan.getEnd());

    return threadIdsMatch && clientCallInBounds;
  }

  // Note: do thread id's matter here?
  /** Returns whether span is the child of candidate span */
  _isChildOf(span, candidateSpan) {
    // Child: candidateSpan (server) called span (client)
    const threadIdsMatch =
      span.getClientThreadId() === candidateSpan.getServerThreadId();
    const clientCallInBounds =
      candidateSpan.hasTimestampInServerRange(span.getStart()) &&
      candidateSpan.hasTimestampInServerRange(span.getEnd());

    return threadIdsMatch && clientCallInBounds;
  }

  // Only requires client call is within time bounds (no TID match)
  _isDescendantOf(span, candidateSpan) {
    const clientCallInBounds =
      candidateSpan.hasTimestampInServerRange(span.getStart()) &&
      candidateSpan.hasTimestampInServerRange(span.getEnd());

    return clientCallInBounds;
  }
}

module.exports = TreeGenerator;
