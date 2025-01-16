import * as THREE from "three";
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

  console.log('Box dimensions:', { width, height, depth, scale });

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

  console.log('Item dimensions:', { 
    width, height, depth, 
    originalDims: { xx: item.xx, yy: item.yy, zz: item.zz }, 
    scale 
  });

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    color: item.color || 0x808080,
    opacity: 0.8,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Add edges
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.item.wireframe);
  const wireframe = new THREE.LineSegments(edges, edgeMaterial);
  mesh.add(wireframe);

  // Add a small identifier plate above the item
  if (item.itemName) {
    try {
      const plateWidth = Math.max(0.1, width * 0.8);
      const plateHeight = Math.max(0.05, width * 0.2);
      const plateDepth = 0.01;
      
      const plateGeometry = new THREE.BoxGeometry(plateWidth, plateDepth, plateHeight);
      const plateMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.9,
        transparent: true,
      });
      
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      const plateOffset = Math.max(0.05, height + plateHeight / 2);
      plate.position.set(0, plateOffset, 0);
      plate.rotation.x = Math.PI / 2; // Rotate to be horizontal
      mesh.add(plate);

      // Add a colored border/outline
      const borderGeometry = new THREE.EdgesGeometry(plateGeometry);
      const borderMaterial = new THREE.LineBasicMaterial({
        color: item.color || 0x808080,
        linewidth: 2,
      });
      const border = new THREE.LineSegments(borderGeometry, borderMaterial);
      plate.add(border);
    } catch (error) {
      console.error('Error creating identifier plate:', error);
    }
  }

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
