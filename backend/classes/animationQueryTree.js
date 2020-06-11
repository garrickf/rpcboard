/** animationQueryTree.js
 *
 * Implements a B+ tree-like structure that allows us to efficiently make point-
 * in-time and range queries on a hierarchical call graph. This is useful for
 * visualization, which is concerned with what needs to be drawn and animated.
 */

/**
 * Lists of AnimationInfo objects are stored in leaf nodes. They contain the
 * information for drawing and animating communication.
 */
class AnimationInfo {
  constructor() {
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.nodeId = null;
    this.packetId = null;
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

  getNodeForKey(key) {
    // Returns a reference to the next node whose range envelops the key
  }
}

class AnimationQueryTree {
  constructor(depth) {
    this.root = null;
    this.depth = depth;

    this._constructFromHierarchicalTree();
  }

  getRoot() {
    return this.root;
  }

  queryPoint(t) {
    // TODO: return list of events for range where point is queried
    return 
  }

  queryRange(start, end) {
    // TODO: return generator that iterates from start range to end range
    return
  }

  // Expects: a hierarchical tree in object form
  // Function: will call methods and build up tree
  _constructFromHierarchicalTree(hTree_obj) {
    // Get all timestamps out from the tree
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Subdivide the N timestamps into groups based on depth (ie compute fanout)
    const fanout = 3;

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

    // Create internal nodes up to root
    let branches = leafNodes;
    while (true) {
      branches = this._layerIndexNodes(branches, fanout);
      console.log(branches);
      if (branches.length === 1) {
        break;
      }
    }

    this.root = branches[0];
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
