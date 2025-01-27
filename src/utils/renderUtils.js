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
  const material = new THREE.MeshBasicMaterial({
    ...RENDER_CONFIG.box.material,
    depthWrite: false // Better transparency handling
  });
  const cube = new THREE.Mesh(geometry, material);

  // Create wireframe with better performance settings
  const wireframeGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    ...RENDER_CONFIG.box.wireframe,
    depthWrite: false
  });
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
    color: item.color || 0x808080,
    transparent: true,
    opacity: 0.6,
    depthWrite: false // Better transparency handling
  });

  const mesh = new THREE.Mesh(geometry, material);
  
  // Create wireframe with better performance settings
  const wireframeGeometry = new THREE.EdgesGeometry(geometry);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: RENDER_CONFIG.item.wireframe.color,
    transparent: true,
    opacity: RENDER_CONFIG.item.wireframe.opacity,
    depthWrite: false
  });
  
  const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
  mesh.add(wireframe);

  return mesh;
};

export const setupScene = () => {
  const scene = new THREE.Scene();
  
  // Add ambient light for consistent lighting
  const ambientLight = new THREE.AmbientLight(
    RENDER_CONFIG.lights.ambient.color,
    RENDER_CONFIG.lights.ambient.intensity
  );
  scene.add(ambientLight);

  // Add directional light for depth
  const directionalLight = new THREE.DirectionalLight(
    RENDER_CONFIG.lights.directional.color,
    RENDER_CONFIG.lights.directional.intensity
  );
  directionalLight.position.set(
    RENDER_CONFIG.lights.directional.position.x,
    RENDER_CONFIG.lights.directional.position.y,
    RENDER_CONFIG.lights.directional.position.z
  );
  scene.add(directionalLight);

  return scene;
};

export const setupRenderer = (gl) => {
  const renderer = new Renderer({ gl });
  
  // Configure renderer for React Native
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1); // Use 1 for better performance on mobile
  renderer.shadowMap.enabled = false; // Disable shadows for better performance
  
  return renderer;
};

export const setupCamera = (gl, isSpecialSize = false) => {
  const { width, height } = gl.drawingBufferWidth 
    ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
    : { width: 1, height: 1 };

  const config = isSpecialSize 
    ? RENDER_CONFIG.camera.settings.special 
    : RENDER_CONFIG.camera.settings.normal;

  const camera = new THREE.PerspectiveCamera(
    config.fov,
    width / height,
    0.1,
    1000
  );

  camera.position.set(
    RENDER_CONFIG.camera.initialPosition.x,
    RENDER_CONFIG.camera.initialPosition.y,
    RENDER_CONFIG.camera.initialPosition.z
  );

  return camera;
};
