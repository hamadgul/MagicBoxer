import * as THREE from "three";
import { RENDER_CONFIG } from "./renderConfig";

export const createBoxMesh = (box, scale) => {
  const geometry = new THREE.BoxGeometry(
    box.x / scale,
    box.y / scale,
    box.z / scale
  );
  
  const material = new THREE.MeshBasicMaterial(RENDER_CONFIG.box.material);
  const cube = new THREE.Mesh(geometry, material);

  // Create wireframe
  const wireframeGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.box.wireframe);
  const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
  cube.add(wireframe);

  return cube;
};

export const createItemMesh = (item, scale) => {
  const geometry = new THREE.BoxGeometry(
    item.xx / scale,
    item.yy / scale,
    item.zz / scale
  );
  const material = new THREE.MeshPhongMaterial({
    color: item.color,
    opacity: 0.8,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Add edges
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.box.wireframe);
  const wireframe = new THREE.LineSegments(edges, edgeMaterial);
  mesh.add(wireframe);

  return mesh;
};

export const setupScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(RENDER_CONFIG.scene.background);

  // Add lights
  const ambientLight = new THREE.AmbientLight(
    RENDER_CONFIG.lights.ambient.color,
    RENDER_CONFIG.lights.ambient.intensity
  );
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(
    RENDER_CONFIG.lights.directional.color,
    RENDER_CONFIG.lights.directional.intensity
  );
  directionalLight.position.set(...RENDER_CONFIG.lights.directional.position);
  scene.add(directionalLight);

  return scene;
};
