/** geometry.js
 *
 * Defines and exports geometries, from which meshes will be generated.
 */

import * as THREE from "three";

const radius = 5;
const segments = 8;
const circleGeometry = new THREE.CircleBufferGeometry(radius, segments);
const packetGeometry = new THREE.CircleBufferGeometry(1, segments);

export { circleGeometry, packetGeometry };
