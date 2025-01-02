import { getScale } from '../../utils/boxSizes';

export const updateItemPositions = (itemsTotal, value, box) => {
  if (!Array.isArray(itemsTotal) || !box) return;

  const scale = getScale(box);
  const baseMovement = box.y / 10;
  const maxMovement = scale <= 6 ? 
    baseMovement * 4 * Math.pow(15, (6 - scale) / 6) : 
    baseMovement * 1.5;

  itemsTotal.forEach((item) => {
    if (item?.dis) {
      const normalizedValue = (value / Math.PI) * Math.PI;
      item.dis.position.y = Math.sin(normalizedValue) * maxMovement + item.pos[1];
    }
  });
};

export const updateCameraPosition = (camera, phi, theta, boxRotationY) => {
  if (!camera) return;
  
  camera.position.x = 5 * Math.sin(phi) * Math.cos(theta + boxRotationY);
  camera.position.y = 5 * Math.cos(phi);
  camera.position.z = 5 * Math.sin(phi) * Math.sin(theta + boxRotationY);
  camera.lookAt(0, 0, 0);
};
