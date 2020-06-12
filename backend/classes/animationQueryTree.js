/** animationQueryTree.js
 *
 * Implements a B+ tree-like structure that allows us to efficiently make point-
 * in-time and range queries on a hierarchical call graph. This is useful for
 * visualization, which is concerned with what needs to be drawn and animated.
 *
 * Useful client methods: queryPoint, queryRange
 */

/**
 * Lists of AnimationInfo objects are stored in leaf nodes. They contain the
 * information for drawing and animating communication.
 */

const EVENT_TYPES = {
  NOTHING: "nothing",
  SERVER_PROCESSING: "server_processing",
  CLIENT_PROCESSING: "client_processing",
  COMMUNICATING: "communicating",
};
class AnimationInfo {
  constructor() {
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.event = EVENT_TYPES.NOTHING;
    this.metadata = {};
  }
}

/**
 * A Leaf node stores information about what events are happening between a
 * range. It also stores prev and next references, so the bottom layer can be
 * traversed as a doubly-linked list.
 */
class LeafNode {
  constructor() {
    this._rangeStart = 0;
    this._rangeEnd = 0;
    this.prev = null;
    this.next = null;
    this.values = [];
  }

  // Useful for speeding up animation if there's nothing to animate
  isEmpty() {
    return !this.values;
  }

  rangeEnd() {
    return this._rangeEnd;
  }

  rangeStart() {
    return this._rangeStart;
  }
}
// Use doubly-linked list for range queries

/**
 * An Index node contains up to N+1 keys and N associated references
 */
class IndexNode {
  constructor(size) {
    this.keys = [];
    this.values = [];
  }

  rangeEnd() {
    return this.keys[this.keys.length - 1];
  }

  rangeStart() {
    return this.keys[0];
  }
}

class AnimationQueryTree {
  /**
   * The constructor builds an AQT from the hierarchical tree and supplied
   * timestamps.
   */
  constructor(depth, hTree, timestamps) {
    this.root = null;
    this.depth = depth;

    this._constructFromHierarchicalTree(hTree, timestamps);
  }

  getRoot() {
    return this.root;
  }

  queryPoint(k) {
    // _find returns a LeafNode, return values (an array)
    return this._find(k).values;
  }

  rangeStart() {
    return this.root && this.root.rangeStart();
  }

  rangeEnd() {
    return this.root && this.root.rangeEnd();
  }

  /**
   * Returns generator that yields lists of animation structures from start
   * range to end range
   */
  queryRange(start, end) {
    const startLeafNode = this._find(start);
    const generator = function* () {
      let curr = startLeafNode;
      while (!!curr && curr.rangeEnd() <= end) {
        yield curr.values;
        curr = curr.next;
      }
      return null;
    };

    return generator;
  }

  /** Takes a value and inserts it into all ranges of the AQT */
  _insertRange(start, end, value) {
    const leafNode = this._find(start);

    // While leafNode's rangeEnd is < end, keep navigating forward and placing
    // value in values
    let curr = leafNode;
    while (!!curr && curr.rangeEnd() <= end) {
      curr.values.push(value);
      curr = curr.next;
    }

    console.log(leafNode);
  }

  /** Returns LeafNode */
  _find(k) {
    const findRec = (node, k) => {
      if (!node.hasOwnProperty("keys")) {
        // Leaf node case:
        return node;
      }

      // Index node case:
      let result = null;
      node.values.forEach((childNode, idx) => {
        // Check keys at idx and idx+1, should be geq the first key
        if (node.keys[idx] <= k && node.keys[idx + 1] > k) {
          result = findRec(childNode, k);
        }
      });
      return result;
    };

    // Run recursive function on root with key k
    return findRec(this.root, k);
  }

  /** Build AQT given hTree (class) and list of sorted Timestamps */
  _constructFromHierarchicalTree(hTree, timestamps) {
    // Assumes timestamps are sorted (this should happen server side)
    const keys = timestamps;

    const fanout = 4; // Temporary

    // Produce leaf nodes with information
    const leafNodes = keys.slice(0, -1).map((key, idx) => {
      const leafNode = new LeafNode();
      leafNode._rangeStart = key;
      leafNode._rangeEnd = keys[idx + 1];
      return leafNode;
    });

    // Wire leaf node prev and next connections
    leafNodes.forEach((leafNode, idx, arr) => {
      if (idx > 0) {
        // Wire up the previous node
        leafNode.prev = arr[idx - 1];
      }
      if (idx < arr.length) {
        // Wire up the next node
        leafNode.next = arr[idx + 1];
      }
    });

    // Create internal nodes until we reach root
    let branches = leafNodes;
    while (true) {
      branches = this._layerIndexNodes(branches, fanout);
      // console.log(branches); // DEBUG
      if (branches.length === 1) {
        break;
      }
    }

    this.root = branches[0];

    // Traverse hTree and do range inserts into the tree
    const traverseTree = (hTreeNode) => {
      hTreeNode.getChildren().forEach((childNode) => {
        traverseTree(childNode);
      });

      // If the treeNode isn't root, create information from its span and insert
      // into the AQT
      if (!hTreeNode.isRoot()) {
        this._addSpanAnimationData(hTreeNode.getSpan());
      }
    };

    traverseTree(hTree);
  }

  _addSpanAnimationData(span) {
    // Client processing animation info
    const clientAnimationInfo = new AnimationInfo();
    clientAnimationInfo.rangeStart = span.getStart();
    clientAnimationInfo.rangeEnd = span.getEnd();
    clientAnimationInfo.event = EVENT_TYPES.CLIENT_PROCESSING;
    clientAnimationInfo.metadata = {
      nodeId: span.getClientNodeId(),
    };
    // Start with inserting client animation info
    this._insertRange(
      clientAnimationInfo.rangeStart,
      clientAnimationInfo.rangeEnd,
      clientAnimationInfo
    );

    // Request (C->S) animation info
    const requestAnimationInfo = new AnimationInfo();
    requestAnimationInfo.rangeStart = span.getStart();
    requestAnimationInfo.rangeEnd = span.getServerStart();
    requestAnimationInfo.event = EVENT_TYPES.COMMUNICATING;
    requestAnimationInfo.metadata = {
      fromNodeId: span.getClientNodeId(),
      toNodeId: span.getServerNodeId(),
    };
    this._insertRange(
      requestAnimationInfo.rangeStart,
      requestAnimationInfo.rangeEnd,
      requestAnimationInfo
    );

    // Server processing animation info
    const serverAnimationInfo = new AnimationInfo();
    serverAnimationInfo.rangeStart = span.getServerStart();
    serverAnimationInfo.rangeEnd = span.getServerEnd();
    serverAnimationInfo.event = EVENT_TYPES.SERVER_PROCESSING;
    serverAnimationInfo.metadata = {
      nodeId: span.getServerNodeId(),
    };

    // Reply (S->C) animation info
    const replyAnimationInfo = new AnimationInfo();
    replyAnimationInfo.rangeStart = span.getServerEnd();
    replyAnimationInfo.rangeEnd = span.getEnd();
    replyAnimationInfo.event = EVENT_TYPES.COMMUNICATING;
    replyAnimationInfo.metadata = {
      fromNodeId: span.getServerNodeId(),
      toNodeId: span.getClientNodeId(),
    };
    this._insertRange(
      replyAnimationInfo.rangeStart,
      replyAnimationInfo.rangeEnd,
      replyAnimationInfo
    );
  }

  _layerIndexNodes(allBranches, fanout) {
    const indexNodes = [];

    for (let idx = 0; idx < allBranches.length; idx += fanout) {
      const indexNode = new IndexNode(fanout);
      const selectedBranches = allBranches.slice(idx, idx + fanout);
      indexNode.keys.push(selectedBranches[0].rangeStart());
      selectedBranches.forEach((branch, branchIdx) => {
        // Fill in the right key and the value
        indexNode.keys.push(branch.rangeEnd());
        indexNode.values.push(branch);
      });

      indexNodes.push(indexNode);
    }

    return indexNodes;
  }
}

// a = new AnimationQueryTree();
// console.log(a);
module.exports = { AnimationQueryTree };
