/** index.js
 *
 * The main visualization.
 *
 * Usage (with React): wrap in a component and provide a reference to a HTML
 * canvas element. rpc-viz will handle drawing assembled metadata information
 * output from the debug server.
 *
 * Sources:
 * - Vizceral Source (https://github.com/Netflix/vizceral)
 *    - Great for reverse engineering some initial components
 * - EventEmitter Documentation (https://www.tutorialspoint.com/nodejs/nodejs_event_emitter.htm)
 *    - Useful information for the class we extend
 * - three.js Fundamentals (https://threejsfundamentals.org/)
 *    - Great for getting up to speed with three.js
 */

import EventEmitter from "events"; // For EventEmitter
import * as THREE from "three";
import { circleGeometry, packetGeometry } from "./geometry";
import {
  cyanMatteMaterial,
  magentaMatteMaterial,
  whiteMatteMaterial,
  lineMaterial,
} from "./material";

// Super external (move to shared?)
import { AnimationQueryTree } from "../../../../backend/classes/animationQueryTree";
import {
  hTreeFromObj,
  timestampsFromNSStringArray,
} from "../../../../backend/serialization";

class Viz extends EventEmitter {
  /** The constructor sets up the visualization */
  constructor(canvas, targetFrameRate) {
    super();
    this.targetFrameRate = targetFrameRate;
    this.currentTime = null;
    this.animationInterval = 10000; // 10000 nanoseconds

    // Create a scene and set the background color
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // Create a rudimentary camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    // Create parameters for the renderer
    const parameters = { alpha: true, antialias: true };
    if (canvas) {
      console.log("(rpcviz) canvas provided");
      parameters.canvas = canvas;
    }

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer(parameters);

    // Note: Instead of using setPixelRatio, we manually calculate the correct
    // canvas size in resizeRendererToDisplaySize

    // Set CSS width and height to expand to fill parent DOM element
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";

    // Create container objects to store information about entities in
    // the visualization
    this.uuidToNodeMesh = {};
    this.nameToNodeMesh = {};

    this.graph = {};

    this.packetMetadata = {};

    // Old example graph
    // this.graph = {
    //   nodes: [
    //     { name: "A", outlinks: ["B", "C"], position: { x: 0, y: 0 } },
    //     { name: "B", outlinks: ["A"], position: { x: 40, y: 0 } },
    //     { name: "C", outlinks: ["A"], position: { x: 0, y: -40 } },
    //   ],
    //   // packets: [],
    //   edges: [
    //     { from: "A", to: "B" },
    //     { from: "B", to: "A" },
    //     { from: "A", to: "C" },
    //     { from: "C", to: "A" },
    //   ],
    // };

    // Draw the graph
    this._addGraphNodes();
    this._addGraphEdges();

    // Bookkeeping structures
    this.nodeMetadata = {};

    // Note: how to add ambient lighting...
    // this.scene.add(new THREE.AmbientLight(0xffffff));
  }

  // TODO: provide method to set information

  // TODO: create hooks for information
  // get ns of frame (?)
  // reset positions of nodes
  // rename a node

  /** setData is called with the data object ingested from the backend */
  setData(data_obj) {
    console.log("(rpc-viz) setData called");
    this.graph = data_obj.graph; // Adjacency list format
    this.nodeIdToNameMap = data_obj.nodeIdToNameMap;

    // Generate position and nicknames for new nodes
    this._generateNodeMetadata();

    // Redraw
    this._addGraphNodes();
    this._addGraphEdges();

    // Build animationQueryTree using hTree_obj and timestamps
    const hTree = hTreeFromObj(data_obj.hTree_obj);
    const timestamps = timestampsFromNSStringArray(data_obj.timestamps);
    // TODO: deserialize timestamps
    this.animationQueryTree = new AnimationQueryTree(3, hTree, timestamps);

    if (this.currentTime === null) {
      this.currentTime = this.animationQueryTree.rangeStart();
    }
  }

  /** Identifies which pieces of data are new (based on id) and creates metadata */
  _generateNodeMetadata() {
    Object.keys(this.nodeIdToNameMap).forEach((key) => {
      // If not in metadata map, create visualization-specific metadata for it
      if (!this.nodeMetadata.hasOwnProperty(key)) {
        this.nodeMetadata[key] = {
          position: this._generateRandomPosition(),
          nickname: null,
        };
      }
    });
  }

  _generateRandomPosition() {
    const max = 40;
    const randomX = Math.floor(Math.random() * max * 2 - max);
    const randomY = Math.floor(Math.random() * max * 2 - max);
    return {
      x: randomX,
      y: randomY,
    };
  }

  /** Returns object containing name and nickname (if previously set) */
  _getNameForNodeId(nodeId) {
    const name = this.nodeIdToNameMap[nodeId];
    const nickname = this.nodeMetadata[nodeId].nickname;
    return {
      name,
      nickname,
    };
  }

  /**
   * Adds graph node meshes
   */
  _addGraphNodes() {
    // var material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    // this.cube = new THREE.Mesh(circleGeometry, cyanMatteMaterial);

    // const other = new THREE.Mesh(circleGeometry, cyanMatteMaterial);
    // other.position.x = 10;
    // this.scene.add(this.cube);
    // this.scene.add(other);

    // outlinks: connections to other nodes
    Object.keys(this.graph).forEach((key) => {
      // Fetch metadata
      const outlinks = this.graph[key];
      const position = this.nodeMetadata[key].position;

      if (!this.nodeMetadata[key].hasOwnProperty("mesh")) {
        this.nodeMetadata[key].mesh = new THREE.Mesh(
          circleGeometry,
          cyanMatteMaterial
        );
      }
      const nodeMesh = this.nodeMetadata[key].mesh;
      nodeMesh.material = cyanMatteMaterial; // Reset color

      // Update position if needed
      nodeMesh.position.x = position.x;
      nodeMesh.position.y = position.y;
      nodeMesh.userData = {
        // User data contains information we can access later when directly
        // accessing the drawn object
        name,
        outlinks,
      };
      // Add to our scene graph
      this.scene.add(nodeMesh);
      // console.log(nodeMesh);

      // Record the nodeMesh in lookup structures for convenience
      this.uuidToNodeMesh[nodeMesh.uuid] = nodeMesh;
      this.nameToNodeMesh[name] = nodeMesh;
    });
  }

  // TODO: create proper edd edges method (are all the edges provided??)
  // Need to lift from the adjacency list map

  /**
   * Add graph line meshes
   */
  _addGraphEdges() {
    // TODO: keep track of edgeMesh, so we don't overdraw them. Need a double map
    Object.keys(this.graph).forEach((key) => {
      const fromId = key;
      const fromNode = this.nodeMetadata[fromId];
      this.graph[key].forEach((toId) => {
        const toNode = this.nodeMetadata[toId];

        // Create an edge between from and to
        const points = [];
        points.push(
          new THREE.Vector3(fromNode.position.x, fromNode.position.y, 0)
        );
        points.push(new THREE.Vector3(toNode.position.x, toNode.position.y, 0));
        // console.log(points);
        // Reference: https://threejs.org/docs/#manual/en/introduction/Drawing-lines
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const edgeMesh = new THREE.Line(edgeGeometry, lineMaterial); // `Line` important :(
        // Add to our scene graph
        this.scene.add(edgeMesh);
        // console.log(edgeMesh);
      });
    });
  }

  /**
   * Tells the browser we wish to perform an animation. Calls _animate callback
   * before repaint.
   */
  requestAnimationFrame() {
    requestAnimationFrame(() => this.animate());
  }

  // animate (time) {
  //   if (this.targetFrameLength === null) {
  //     this.requestAnimationFrame();
  //   } else {
  //     // Call requestAnimationFrame to be as close to the target frame rate as we can
  //     // performance.now allows sub-millisecond timing for maximum smoothness
  //     const now = performance.now();
  //     const nextRenderAt = Math.max(now, this.lastRenderAt + this.targetFrameLength);
  //     const nextRenderIn = nextRenderAt - now;
  //     setTimeout(this.requestAnimationFrame.bind(this), nextRenderIn);
  //     this.lastRenderAt = nextRenderAt;
  //   }
  //   this.render(time);
  // }

  /**
   * The animation loop consists of responsively resizing the renderer if
   * needed, then rendering the graph at the specified timestamp.
   */
  animate() {
    this.requestAnimationFrame();
    this.resizeRendererToDisplaySize();

    if (this.currentTime === null) {
      return this.renderer.render(this.scene, this.camera);
    }

    // Create a new timestamp to query the AQT given the current timestamp
    this.currentTime.setNanoseconds(
      this.currentTime.getNanoseconds() + this.animationInterval
    );

    // Reset/redraw graph
    this._addGraphNodes();
    this._addGraphEdges();

    if (this.animationQueryTree.rangeEnd() < this.currentTime) {
      return;
    }

    // Get animation information
    const animationInfoArray = this.animationQueryTree.queryPoint(
      this.currentTime
    );

    const newPackets = {};

    // Process animation events
    animationInfoArray.forEach((animationInfo) => {
      // TODO: import constants
      if (animationInfo.event === "client_processing") {
        const { nodeId } = animationInfo.metadata;
        const mesh = this.nodeMetadata[nodeId].mesh;
        mesh.material = magentaMatteMaterial;
      }
      if (animationInfo.event === "communicating") {
        const { fromNodeId, toNodeId } = animationInfo.metadata;
        const key = `${fromNodeId}${toNodeId}`;

        let packetMesh = null;
        if (!this.packetMetadata.hasOwnProperty(key)) {
          const newMesh = new THREE.Mesh(packetGeometry, whiteMatteMaterial);
          newPackets[key] = newMesh;
          this.scene.add(newMesh);
          packetMesh = newMesh;
        } else {
          packetMesh = this.packetMetadata[key];
        }

        const fromNodePosition = this.nodeMetadata[fromNodeId].position;
        const toNodePosition = this.nodeMetadata[toNodeId].position;
        const percentDone = this._computePercentComplete(
          animationInfo.rangeStart,
          animationInfo.rangeEnd
        );
        const packetY =
          (toNodePosition.y - fromNodePosition.y) * percentDone +
          fromNodePosition.y;
        const packetX =
          (toNodePosition.x - fromNodePosition.x) * percentDone +
          fromNodePosition.x;
        const position = {
          x: packetX,
          y: packetY,
        };
        packetMesh.position.x = position.x;
        packetMesh.position.y = position.y;
      }
    });

    // Clean up old packet meshes 
    Object.keys(this.packetMetadata).forEach((key) => {
      if (!newPackets.hasOwnProperty(key)) {
        // Remove mesh
        this.scene.remove(this.packetMetadata[key]);
      }
    });
    this.packetMetadata = newPackets;

    return this.renderer.render(this.scene, this.camera);
  }

  _computePercentComplete(start, end) {
    const ns_diff = this.currentTime.getNanoseconds() - start.getNanoseconds()
    const ns_range =  end.getNanoseconds() - start.getNanoseconds()
    const time_diff_sec = (this.currentTime.getTime() - start.getTime()) / 1000;
    const time_range_sec = (end.getTime() - start.getTime()) / 1000;
    const percent = (time_diff_sec + ns_diff / 1e9) / (time_range_sec + ns_range / 1e9);
    return percent;
  }

  /**
   * render is a utility method called in animate, which throttles animation
   * The other stuff below are utilities
   */
  /**
   * Perform tween animations; resize the canvas if needed
   */
  _render(time) {
    TWEEN.update();

    this.resizeRendererToDisplaySize();

    this.camera.lookAt(this.cameraTarget);
    if (this.currentGraph) {
      this.currentGraph.update(time);
    }
    this.renderer.render(this.scene, this.camera);
  }

  updateBoundingRectCache() {
    this.boundingRect = this.renderer.domElement.getBoundingClientRect();
  }

  /**
   * Checks canvas dimensions and resizes renderer to match if necessary
   */
  resizeRendererToDisplaySize() {
    const canvas = this.renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const w = (canvas.clientWidth * pixelRatio) | 0;
    const h = (canvas.clientHeight * pixelRatio) | 0;

    const needResize = canvas.width !== w || canvas.height !== h;
    if (needResize) {
      // Store new width and height
      this.width = w;
      this.height = h;
      this.renderer.setSize(w, h, false); // False: don't set canvas CSS size

      // Resize aspect ratio
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  // This code takes into account the graph's width and height. what does that mean?
  setSize(w, h) {
    // Update aspect ratio
    const viewAspectRatio = w / h;
    const graphAspectRatio = graphWidth / graphHeight;
    let scale;
    if (viewAspectRatio > graphAspectRatio) {
      // if the aspect is wider than the graph aspect
      scale = h / graphHeight;
      w = graphWidth * (viewAspectRatio / graphAspectRatio);
      h = graphHeight;
    } else {
      // if the aspect is taller than the graph aspect
      scale = w / graphWidth;
      h = graphHeight / (viewAspectRatio / graphAspectRatio);
      w = graphWidth;
    }

    RendererUtils.setScale(scale);

    this.camera.left = w / -2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = h / -2;

    this.camera.updateProjectionMatrix();

    this.updateBoundingRectCache();
  }
}

export default Viz;
