import * as THREE from "three";
import { Renderer } from "expo-three";
import { RENDER_CONFIG } from "./renderConfig";

const validateDimension = (value, scale, defaultValue = 1) => {
  if (!value || isNaN(value) || !isFinite(value) || value <= 0) {
    console.warn(`Invalid dimension value: ${value}`);
    return defaultValue;
  }
  if (!scale || isNaN(scale) || !isFinite(scale) || scale <= 0) {
    console.warn(`Invalid scale value: ${scale}`);
    return value;
  }
  return value / scale;
};

export const createBoxMesh = (box, scale) => {
  if (!box || !scale) {
    console.error('Invalid box or scale:', { box, scale });
    return null;
  }

  // Validate and normalize dimensions
  const width = validateDimension(box.x, scale);
  const height = validateDimension(box.y, scale);
  const depth = validateDimension(box.z, scale);

  const geometry = new THREE.BoxGeometry(width, height, depth);
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
  if (!item || !scale) {
    console.error('Invalid item or scale:', { item, scale });
    return null;
  }

  // Validate and normalize dimensions
  const width = validateDimension(item.xx, scale);
  const height = validateDimension(item.yy, scale);
  const depth = validateDimension(item.zz, scale);

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({
    ...RENDER_CONFIG.item.wireframe,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  
  // Add wireframe
  const wireframeGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.item.wireframe);
  const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
  mesh.add(wireframe);

  return mesh;
};

export const setupScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(RENDER_CONFIG.scene.background);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(
    RENDER_CONFIG.lights.ambient.color,
    RENDER_CONFIG.lights.ambient.intensity
  );
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(
    RENDER_CONFIG.lights.directional.color,
    RENDER_CONFIG.lights.directional.intensity
  );
  directionalLight.position.set(...RENDER_CONFIG.lights.directional.position);
  scene.add(directionalLight);

  return scene;
};

export const setupRenderer = (gl) => {
  const renderer = new Renderer({ gl });
  renderer.setPixelRatio(RENDER_CONFIG.renderer.pixelRatio);
  renderer.sortObjects = RENDER_CONFIG.renderer.sortObjects;
  return renderer;
};

export const setupCamera = (gl, isSpecialSize = false) => {
  const settings = isSpecialSize ? 
    RENDER_CONFIG.camera.settings.special : 
    RENDER_CONFIG.camera.settings.normal;

  const camera = new THREE.PerspectiveCamera(
    settings.fov,
    gl.drawingBufferWidth / gl.drawingBufferHeight,
    0.1,
    1000
  );

  const { x, y, z } = RENDER_CONFIG.camera.initialPosition;
  camera.position.set(x, y, z);
  camera.lookAt(...RENDER_CONFIG.camera.lookAt);

  return camera;
};
