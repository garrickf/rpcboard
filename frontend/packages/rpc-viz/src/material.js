/** material.js
 *
 * Defines and exports materials, from which meshes can be generated.
 */

import * as THREE from "three";

const cyanMatteMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

export { cyanMatteMaterial, lineMaterial };
