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
import { circleGeometry } from "./geometry";
import { cyanMatteMaterial, lineMaterial } from "./material";

class Viz extends EventEmitter {
  constructor(canvas, targetFrameRate) {
    super();
    console.log("I am a viz roar");

    // Create a scene and set the background color
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xaaaaaa);

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

    this.graph = {
      nodes: [
        { name: "A", outlinks: ["B", "C"], position: { x: 0, y: 0 } },
        { name: "B", outlinks: ["A"], position: { x: 50, y: 0 } },
        { name: "C", outlinks: ["A"], position: { x: 0, y: -50 } },
      ],
      // packets: [],
      edges: [
        { from: "A", to: "B" },
        { from: "B", to: "A" },
        { from: "A", to: "C" },
        { from: "C", to: "A" },
      ],
    };

    // Draw the graph
    this.addGraphNodes();
    this.addGraphEdges();
    // console.log(this.uuidToNodeMesh);
    // console.log(this.nameToNodeMesh);

    // var material = lineMaterial;

    // var points = [];
    // points.push(new THREE.Vector3(-10, 0, 0));
    // points.push(new THREE.Vector3(0, 10, 0));

    // var geometry = new THREE.BufferGeometry().setFromPoints(points);

    // var line = new THREE.Line(geometry, material);
    // this.scene.add(line);

    // Note: how to add ambient lighting...
    // this.scene.add(new THREE.AmbientLight(0xffffff));
  }

  /**
   * Adds graph node meshes
   */
  addGraphNodes() {
    // var material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    // this.cube = new THREE.Mesh(circleGeometry, cyanMatteMaterial);

    // const other = new THREE.Mesh(circleGeometry, cyanMatteMaterial);
    // other.position.x = 10;
    // this.scene.add(this.cube);
    // this.scene.add(other);

    this.graph.nodes.forEach(({ name, outlinks, position }) => {
      const nodeMesh = new THREE.Mesh(circleGeometry, cyanMatteMaterial);
      nodeMesh.position.x = position.x;
      nodeMesh.position.y = position.y;
      nodeMesh.userData = {
        name,
        outlinks,
      };
      // Add to our scene graph
      this.scene.add(nodeMesh);

      // Record the nodeMesh in lookup structures for convenience
      this.uuidToNodeMesh[nodeMesh.uuid] = nodeMesh;
      this.nameToNodeMesh[name] = nodeMesh;
    });
  }

  /**
   * Add graph line meshes
   */
  addGraphEdges() {
    this.graph.edges.forEach(({ from, to }) => {
      const points = [];
      points.push(
        new THREE.Vector3(
          this.nameToNodeMesh[from].position.x,
          this.nameToNodeMesh[from].position.y,
          0
        )
      );
      points.push(
        new THREE.Vector3(
          this.nameToNodeMesh[to].position.x,
          this.nameToNodeMesh[to].position.y,
          0
        )
      );
      console.log(points);

      // Reference: https://threejs.org/docs/#manual/en/introduction/Drawing-lines
      const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const edgeMesh = new THREE.Line(edgeGeometry, lineMaterial); // `Line` important :(

      // Add to our scene graph
      this.scene.add(edgeMesh);
      console.log(edgeMesh);
    });
  }

  // TODO: implement events and handles
  requestAnimationFrame() {
    requestAnimationFrame(this.animate.bind(this));
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
    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;
    this.resizeRendererToDisplaySize(); // TODO: move out, only put in render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * render is a utility method called in animate, which throttles animation
   * The other stuff below are utilities
   */
  /**
   * Perform tween animations; resize the canvas if needed
   */
  render(time) {
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
