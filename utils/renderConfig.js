// Shared configuration for 3D rendering
export const RENDER_CONFIG = {
  box: {
    material: {
      transparent: true,
      opacity: 0.25,
      color: 0x808080,
    },
    wireframe: {
      color: 0x000000,  // Black wireframe for box
      opacity: 0.7,
    }
  },
  item: {
    wireframe: {
      color: 'white',   // White wireframe for items
      opacity: 0.7,
    }
  },
  camera: {
    defaultDistance: 5,
    specialDistance: 3.5,
    defaultFOV: 75,
    specialFOV: 60,
  },
  lights: {
    ambient: {
      color: 0xffffff,
      intensity: 0.8,
    },
    directional: {
      color: 0xffffff,
      intensity: 0.5,
      position: [5, 5, 5],
    },
  },
  scene: {
    background: 0xffffff,
  },
};
