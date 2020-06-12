/** material.js
 *
 * Defines and exports materials, from which meshes can be generated.
 */

import * as THREE from "three";

const cyanMatteMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const magentaMatteMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const whiteMatteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

export {
  cyanMatteMaterial,
  magentaMatteMaterial,
  whiteMatteMaterial,
  lineMaterial,
};
