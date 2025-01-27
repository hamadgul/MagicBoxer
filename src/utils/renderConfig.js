import * as THREE from "three";

// Shared configuration for 3D rendering
export const RENDER_CONFIG = {
  box: {
    material: {
      transparent: true,
      opacity: 0.25,
      color: 0x808080,
      side: THREE.FrontSide, // Better performance than DoubleSide
      depthWrite: false // Better transparency handling
    },
    wireframe: {
      color: 0x000000,
      opacity: 0.7,
      transparent: true,
      depthWrite: false
    },
    animation: {
      duration: 600,
      scale: {
        min: 0.8,
        max: 1
      }
    }
  },
  item: {
    wireframe: {
      color: 'white',
      opacity: 0.7,
      transparent: true,
      depthWrite: false
    }
  },
  camera: {
    defaultDistance: 5,
    specialDistance: 3.5,
    defaultFOV: 75,
    specialFOV: 60,
    settings: {
      normal: { 
        distance: 5, 
        fov: 75 
      },
      special: { 
        distance: 3.5, 
        fov: 60 
      }
    },
    lookAt: [0, 0, 0],
    initialPosition: { x: -1.2, y: 0.5, z: 5 }
  },
  lights: {
    ambient: {
      color: 0xffffff,
      intensity: 0.8,
    },
    directional: {
      color: 0xffffff,
      intensity: 0.6,
      position: {
        x: 5,
        y: 5,
        z: 5
      }
    },
  },
  scene: {
    background: 0xffffff,
  },
  renderer: {
    pixelRatio: 1,
    sortObjects: false
  }
};
