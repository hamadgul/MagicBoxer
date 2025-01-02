// Helper function to check dimensions with tolerance
export const matchDims = (box, x, y, z) => 
  Math.abs(box.x - x) < 0.01 && 
  Math.abs(box.y - y) < 0.01 && 
  Math.abs(box.z - z) < 0.01;

// Get scale factor for a box
export const getScale = (box) => {
  if (!box) return 10;

  // Very small boxes need more magnification
  if (matchDims(box, 6.25, 3.125, 0.5)) return 6;
  if (matchDims(box, 8.75, 5.5625, 0.875)) return 8;
  if (matchDims(box, 6, 4, 2)) return 6;
  if (matchDims(box, 9, 6, 3)) return 6;
  if (matchDims(box, 8.6875, 5.4375, 1.75)) return 6;
  if (matchDims(box, 9.4375, 6.4375, 2.1875)) return 6;
  if (matchDims(box, 10, 7, 3)) return 6;
  if (matchDims(box, 7.25, 7.25, 6.5)) return 6;
  if (matchDims(box, 8.75, 2.625, 11.25)) return 6;
  if (matchDims(box, 8.75, 4.375, 11.25)) return 6;
  if (matchDims(box, 6, 6, 38)) return 15; // Very tall box
  if (matchDims(box, 6, 6, 6)) return 6; // Small cube box - adjusted from 4 to 6 for better slider movement
  // Medium-small boxes
  if (matchDims(box, 8, 6, 4)) return 8;
  if (matchDims(box, 10.875, 1.5, 12.375)) return 8;
  if (matchDims(box, 10.875, 1.5, 12.37)) return 8;
  
  // Special flat boxes need custom scaling
  if (matchDims(box, 9.5, 15.5, 1)) return 15;
  if (matchDims(box, 12, 3, 17.5)) return 15;
  if (matchDims(box, 18, 12, 4)) return 15;
  if (matchDims(box, 16, 16, 4)) return 15;
  if (matchDims(box, 20, 12, 12)) return 15;
  if (matchDims(box, 16, 12, 12)) return 15;
  if (matchDims(box, 18, 13, 16)) return 15;
  if (matchDims(box, 16, 16, 16)) return 15;
  if (matchDims(box, 25.5625, 6, 5.25)) return 12; // Long box
  if (matchDims(box, 20, 16, 2)) return 10; // Wide flat box
  if (matchDims(box, 24, 18, 6)) return 12; // Large wide box
  if (matchDims(box, 23, 17, 12)) return 12; // Large box

  // Original special sizes
  if (
    (box.x === 12 && box.y === 15.5 && box.z === 3) ||
    (box.x === 17 && box.y === 11 && box.z === 8) ||
    (box.x === 17 && box.y === 17 && box.z === 7) ||
    (box.x === 16 && box.y === 13 && box.z === 3) ||
    (box.x === 9 && box.y === 6 && box.z === 3)
  ) return 12;

  // Default scaling based on max dimension
  const maxDim = Math.max(box.x, box.y, box.z);
  if (maxDim > 24) return 15;
  if (maxDim > 20) return 12;
  if (maxDim > 15) return 10;
  return 8;
};

// Check if a box is a special size
export const isSpecialSize = (box) => {
  // Original special sizes
  if (
    (box.x === 12 && box.y === 15.5 && box.z === 3) ||
    (box.x === 17 && box.y === 11 && box.z === 8) ||
    (box.x === 17 && box.y === 17 && box.z === 7) ||
    (box.x === 16 && box.y === 13 && box.z === 3) ||
    (box.x === 9 && box.y === 6 && box.z === 3)
  ) return true;
  
  // Very small boxes
  if (
    matchDims(box, 6.25, 3.125, 0.5) ||
    matchDims(box, 8.75, 5.5625, 0.875) ||
    matchDims(box, 6, 4, 2) ||
    matchDims(box, 9, 6, 3) ||
    matchDims(box, 8.6875, 5.4375, 1.75) ||
    matchDims(box, 9.4375, 6.4375, 2.1875) ||
    matchDims(box, 10, 7, 3) ||
    matchDims(box, 7.25, 7.25, 6.5) ||
    matchDims(box, 8.75, 2.625, 11.25) ||
    matchDims(box, 8.75, 4.375, 11.25)
  ) return true;
  
  // Medium-small boxes
  if (
    matchDims(box, 8, 6, 4) ||
    matchDims(box, 10.875, 1.5, 12.375) ||
    matchDims(box, 10.875, 1.5, 12.37)
  ) return true;
  
  // Special flat boxes and large boxes
  if (
    matchDims(box, 9.5, 15.5, 1) ||
    matchDims(box, 12, 3, 17.5) ||
    matchDims(box, 18, 12, 4) ||
    matchDims(box, 16, 16, 4) ||
    matchDims(box, 20, 12, 12) ||
    matchDims(box, 16, 12, 12) ||
    matchDims(box, 18, 13, 16) ||
    matchDims(box, 16, 16, 16)
  ) return true;

  return false;
};