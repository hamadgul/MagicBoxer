import * as THREE from "three";
import ExpoTHREE from "expo-three";

//quicksort needed for itemList/boxList
function quickSort(arr, l, r) {
  var len = arr.length,
    pivot,
    partIndex;
  if (l < r) {
    pivot = r;
    partIndex = partition(arr, pivot, l, r);
    quickSort(arr, l, partIndex - 1);
    quickSort(arr, partIndex + 1, r);
  }
  return arr;
}

function partition(arr, pivot, l, r) {
  var val = arr[pivot].vol,
    partIndex = l;

  for (var i = l; i < r; i++) {
    if (arr[i].vol < val) {
      swap(arr, i, partIndex);
      partIndex++;
    }
  }
  swap(arr, r, partIndex);
  return partIndex;
}

function swap(arr, i, j) {
  var temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

//classes for boxes and items
function Box(dims) {
  this.x = dims[0];
  this.y = dims[1] || 0; // Ensure y is never undefined
  this.z = dims[2];
  this.price = dims[3] || 0; // Price is the fourth element, default to 0 if not provided
  this.isDefaultPrice = dims[4] || false; // Boolean flag indicating if the price is default
  this.cx = this.x / 2;
  this.cy = -this.y / 2; // Check for NaN after computation
  this.cz = this.z / 2;
  this.vol = this.x * this.y * this.z;
  this.items = [];
  this.parts = null;
  this.sec = [];
  this.remainvol = this.vol;

  if (isNaN(this.cy)) {
    console.error("Invalid y dimension", { y: this.y });
    this.cy = 0; // Set a default or corrective value
  }
}

function Item(dims) {
  this.x = dims[0];
  this.y = dims[1] || 0; // Ensure y is never undefined
  this.z = dims[2];
  this.xx = null; // Will be set during box fitting
  this.yy = null; // Will be set during box fitting
  this.zz = null; // Will be set during box fitting
  this.vol = this.x * this.y * this.z;
  this.dis = null;
  this.pos = null;
  this.sec = [];
  this.SKU = dims[3];
  this.color = "";

  if (isNaN(this.y)) {
    console.error("Invalid y dimension in item", { y: this.y });
    this.y = 0; // Set a default or corrective value
  }
}

//find the total volume of the list of items
function vol(itemList) {
  let len = itemList.length;
  var tot = 0;
  for (var i = 0; i < len; i++) {
    tot += itemList[i].vol;
  }
  return tot;
}

//filter out the boxes that aren't big enough to hold all items
function filterVol(boxes, itemVol) {
  let len = boxes.length;
  result = boxes.filter((box) => box.vol >= itemVol);
  return result;
}

//make each dimension into an instance of the class
function initialize(boxes, items) {
  var boxLen = boxes.length;
  var itemLen = items.length;
  for (var i = 0; i < boxLen; i++) {
    boxes[i] = new Box(boxes[i]);
  }
  for (var i = 0; i < itemLen; i++) {
    console.log(items[i]);
    let x = new Item(items[i]);
    items[i] = x;
  }
}

//main packing function that will be called from the details screen
export function pack(itemList, carrier, optionalBox) {
  const boxSizes = optionalBox != 0 ? optionalBox : carrierBoxes(carrier); // Use provided box sizes or generate for carrier
  initialize(boxSizes, itemList); // Initialize boxes and items

  const itemVol = vol(itemList); // Calculate total volume of items
  const filteredBoxes = filterVol(boxSizes, itemVol); // Filter out boxes that can't fit all items by volume
  if (filteredBoxes.length === 0) {
    return 0; // No box found that can fit all items
  }

  // Debugging: Log filtered boxes before sorting
  console.log(
    "Filtered Boxes Before Sorting:",
    filteredBoxes.map((b) => [b.x, b.y, b.z])
  );

  // Sort boxes to prioritize ones that match the item's dimensions closely
  filteredBoxes.sort((a, b) => {
    // Prioritize exact dimension match
    const aFitsExactly =
      a.x === itemList[0].x && a.y === itemList[0].y && a.z === itemList[0].z;
    const bFitsExactly =
      b.x === itemList[0].x && b.y === itemList[0].y && b.z === itemList[0].z;

    if (aFitsExactly && !bFitsExactly) return -1;
    if (!aFitsExactly && bFitsExactly) return 1;

    // If both or neither fit exactly, sort by volume to minimize unused space
    return a.vol - b.vol;
  });

  // Debugging: Log filtered boxes after sorting
  console.log(
    "Filtered Boxes After Sorting:",
    filteredBoxes.map((b) => [b.x, b.y, b.z])
  );

  // Sort items in descending order of volume to pack efficiently
  itemList = quickSort(itemList, 0, itemList.length - 1).reverse();

  // Use the sorted, filtered boxes in the findBox function
  return findBox(itemList, filteredBoxes, 0); // Find the first suitable box for the items
}

//generate the box sizes for the specific carrier
// Generate the box sizes for the specific carrier
function carrierBoxes(carrier) {
  switch (carrier) {
    case "USPS":
      return [
        [8.69, 5.44, 1.75, 1.75, false],
        [11.25, 8.75, 6, 2.25, false],
        [14, 12, 3.5, 2.25, false],
        [12.25, 12.25, 6, 2.75, false],
        [10.125, 7.125, 5, 1.85, false],
        [16.25, 14.5, 12, 3.5, false],
        [7.5, 5.13, 14.38, 1.95, false],
        [13, 11, 1, 1.5, false],
        [15, 9.5, 1, 1.75, false],
        [12.5, 9.5, 1, 1.5, false],
        [12.5, 9.5, 1, 1.5, false],
        [15, 9.5, 1, 1.85, false],
        [12.5, 9.5, 1, 1.5, false],
        [10, 7, 1, 1.5, false],
        [10, 6, 1, 1.5, false],
        [10, 6, 1, 1.5, false],
        [8.69, 5.44, 7.44, 2.25, false],
        [9.25, 6.25, 2, 1.75, false],
        [12, 12, 5.5, 2.75, false],
        [23.69, 11.75, 3, 3.5, false],
      ];
    case "FedEx": // Ensure "FedEx" is correctly matched
      return [
        // [10.875, 1.5, 12.375, false],
        // [8.75, 11.6875, 11.3125, false],
        // [11.5, 2.375, 13.25, false],
        // [8.75, 4.375, 11.3125, false],
        [12, 3, 17.5, 2.25, false], // checked
        [17, 17, 7, 3.25, false], // checked
        [12, 9, 6, 2, false], // checked
        [20, 20, 12, 4.5, false], // checked
        [13, 9, 11, 2.75, false], // checked
        [23, 17, 12, 4.75, false], // checked
        [8, 8, 8, 1.75, false], // checked
        [11, 11, 11, 2.5, false], // checked
        [24, 24, 24, 12, false], // checked
        [14, 14, 14, 3.75, false], // checked
        [28, 28, 28, 15, false], // checked
        [16, 16, 16, 4.29, false], // checked
        [12, 12, 18, 3.75, false], // checked
        [20, 20, 20, 6.29, false], // checked
        [22, 22, 22, 7, false], // checked
        [24, 24, 18, 10, false], // checked
        [18, 13, 11.75, 7, false], // checked
      ];
    case "UPS":
      return [
        [13, 11, 2, 2.25, false],
        [16, 11, 3, 2.5, false],
        [18, 13, 3, 3.0, false],
        [16, 12, 1, 2.0, false],
        [38, 6, 6, 5.5, false],
        [16.5, 13.25, 10.75, 7.0, false],
        [19.25, 17.5, 14, 9.5, false],
        [12.5, 9.5, 1, 1.5, false],
        [15, 9.5, 1, 1.75, false],
        [19.375, 17.375, 14.375, 10.0, false],
        [16.5, 13.25, 10.75, 7.0, false],
      ];
    default:
      return [
        [18, 12.5, 3, 2, true],
        [17, 17, 7, 2, true],
        [12, 9, 6, 2, true],
        [20, 20, 12, 2, true],
        [13, 9, 11, 2, true],
        [23, 17, 12, 2, true],
        [12, 12, 18, 2, true],
        // [8, 8, 8, 2, true],
        [20, 20, 20, 2, true],
        [11, 11, 11, 2, true],
        [24, 24, 24, 2, true],
        [14, 14, 14, 2, true],
        [28, 28, 28, 2, true],
        [16, 16, 16, 2, true],
      ];
  }
}

//iterate through the list of items to add each one to the box. moves to next box if any items fail to be placed in a box. returns finalized box
// iterate through the list of items to add each one to the box. moves to next box if any items fail to be placed in a box. returns finalized box
function findBox(itemList, boxSizes, j) {
  if (j >= boxSizes.length) {
    console.log("No boxes found that can fit the items.");
    return "No boxes found";
  }

  const currentBox = boxSizes[j];
  console.log(
    `Trying to fit items in box: [${currentBox.x}, ${currentBox.y}, ${currentBox.z}]`
  );

  for (var i = 0; i < itemList.length; i++) {
    const fitResult = fitItem(itemList[i], currentBox);
    console.log(
      `Item [${itemList[i].x}, ${itemList[i].y}, ${itemList[i].z}] fits in current box? ${fitResult}`
    );

    if (!fitResult) {
      console.log(
        `Item ${i} does not fit in box [${currentBox.x}, ${currentBox.y}, ${currentBox.z}]. Trying next box...`
      );
      return findBox(itemList, boxSizes, j + 1);
    }
  }

  console.log(
    `All items fit in box [${currentBox.x}, ${currentBox.y}, ${currentBox.z}]. Finalizing box...`
  );
  return finalize(currentBox);
}

//doesn't work completely; this function will take the resulting box object and unnest the boxes inside. This will tell us the positions of each item in the main box.
function finalize(aBox) {
  if (aBox.parts == null) {
    return aBox;
  } else {
    for (var i = aBox.parts.length - 1; i >= 0; i--) {
      if (aBox.parts[i].items != []) {
        aBox.items.concat(aBox.parts[i].items);
        aBox.remainvol -= vol(aBox.parts[i].items);
      }
    }
    return aBox;
  }
}

//split the box into the biggest possible boxes. general (not optimal) approach is to split it up into 3 boxes: the space above the current item, and two resulting boxes next to the item
function splitBox(item, curbox) {
  curbox.items.push(item);
  item.sec = curbox.sec.slice();
  curbox.remainvol -= item.vol;
  var bx = curbox.x - item.xx;
  var by = curbox.y - item.yy;
  var bz = curbox.z - item.zz;
  var boxes = [];
  if (by != 0) {
    //this doesn't catch yet; this will reduce the amount of boxes, since they won't be added if one of their dimensions is 0.
    box1 = new Box([item.xx, by, item.zz]);
    box1.cx = curbox.cx;
    box1.cy = curbox.cy + item.yy;
    box1.cz = curbox.cz;
    box1.sec.push("upper");
    boxes.push(box1);
  }
  if (bx != 0) {
    box2 = new Box([bx, curbox.y, curbox.z]);
    box2.cx = curbox.cx - item.xx;
    box2.cy = curbox.cy;
    box2.cz = curbox.cz;
    box2.sec.push("side");
    boxes.push(box2);
  }
  if (bz != 0) {
    box3 = new Box([item.xx, curbox.y, bz]);
    box3.cx = curbox.cx;
    box3.cy = curbox.cy;
    box3.cz = curbox.cz - item.zz;
    box3.sec.push("behind");
    boxes.push(box3);
  }
  return boxes;
}
//truly checks if the item fits in the box. If the item's volume is greater than the remaining volume, immediately return false
//else, rotate the item as much as it can until it fits inside the box. once it fits, split the resulting box, and return true
//if there was no rotation where the item will fit, we also return false
// Updated checkDimensions function to improve fit logic
function checkDimensions(item, box) {
  console.log(
    `Checking if item [${item.x}, ${item.y}, ${item.z}] fits in box [${box.x}, ${box.y}, ${box.z}]`
  );

  var fits = false;

  // Ensure item volume is not greater than the box's remaining volume
  if (item.vol > box.remainvol) {
    console.log(
      `Item volume ${item.vol} is greater than remaining box volume ${box.remainvol}.`
    );
    return fits;
  }

  // Try all 6 possible rotations
  for (var rotation = 1; rotation <= 6; rotation++) {
    switch (rotation) {
      case 1:
        item.xx = item.x;
        item.yy = item.y;
        item.zz = item.z;
        break;
      case 2:
        item.xx = item.x;
        item.yy = item.z;
        item.zz = item.y;
        break;
      case 3:
        item.xx = item.y;
        item.yy = item.x;
        item.zz = item.z;
        break;
      case 4:
        item.xx = item.y;
        item.yy = item.z;
        item.zz = item.x;
        break;
      case 5:
        item.xx = item.z;
        item.yy = item.x;
        item.zz = item.y;
        break;
      case 6:
        item.xx = item.z;
        item.yy = item.y;
        item.zz = item.x;
        break;
    }

    // Check if item fits within box dimensions after rotation
    if (item.xx <= box.x && item.yy <= box.y && item.zz <= box.z) {
      console.log(
        `Item fits in box with rotation ${rotation}. Item dimensions after rotation: [${item.xx}, ${item.yy}, ${item.zz}]`
      );
      fits = true;
      box.parts = splitBox(item, box); // Split the box for packing
      return fits;
    } else {
      console.log(
        `Rotation ${rotation} does not fit. Item dimensions: [${item.xx}, ${item.yy}, ${item.zz}]`
      );
    }
  }

  console.log(
    `Item [${item.x}, ${item.y}, ${item.z}] does not fit in box [${box.x}, ${box.y}, ${box.z}] after all rotations.`
  );
  return fits;
}

//checks to see if the item will fit inside the box. checks if the box is split up at all. if it isn't, run checkDimensions. If it is split, run this function recursively until it finds
//the boxes that haven't been split and work back from there. we always return the result of checkDimensions, but if the item does fit, we want to stop seaching and immediately return.
function fitItem(item, box) {
  console.log(
    `Checking fit for item [${item.x}, ${item.y}, ${item.z}] in box [${box.x}, ${box.y}, ${box.z}]`
  );

  if (box.parts == null) {
    const dimensionsCheck = checkDimensions(item, box);
    console.log(`Dimensions check for item in box: ${dimensionsCheck}`);
    return dimensionsCheck;
  } else {
    let result;
    for (let i = 0; i < box.parts.length; i++) {
      result = fitItem(item, box.parts[i]);
      if (result) {
        return result; // If item fits in any part of the box, return true
      }
    }
    console.log(
      `Item [${item.x}, ${item.y}, ${item.z}] does not fit in any parts of box [${box.x}, ${box.y}, ${box.z}]`
    );
    return result; // If no part fits, return false
  }
}

function helper(ob, a) {
  if (ob.items.length != 0) {
    a.push(ob);
    for (var i = 0; i < ob.parts.length; i++) {
      helper(ob.parts[i], a);
    }
  }
  return a;
}

export function flatten2(ob) {
  var a = [];
  helper(ob, a);
  return a;
}

export function test(box) {
  return [box.x, box.y, box.z];
}

export function createDisplay(box, scale) {
  var boxes = flatten2(box);
  var items = [];
  //var difcolors = ['#add8e6', '#b9ddea', '#8ec9dc', '#b1dae7', '#6EBAD3', '#6bb8d1', '#3a9cbb', '#a1d3e2'];
  var difcolors = [
    "#FF5733",
    "#2DAE42",
    "#63D7D6",
    "#33C9BF",
    "#617DB3",
    "#C576AE",
    "#D75B65",
    "#7B61B3",
    "#63d7a7",
    "#B655E7",
  ];
  for (var i = 0; i < boxes.length; i++) {
    item = boxes[i].items[0];
    const geo = new THREE.BoxGeometry(
      item.xx / scale - 0.001,
      item.yy / scale - 0.001,
      item.zz / scale - 0.001
    );
    const mat = new THREE.MeshBasicMaterial({
      color: difcolors[i % 10],
      opacity: 1,
      visible: true,
    });
    item.color = difcolors[i % 10];
    const box1 = new THREE.Mesh(geo, mat);
    box1.position.set(
      (boxes[i].cx - item.xx / 2) / scale,
      (boxes[i].cy + item.yy / 2) / scale,
      (boxes[i].cz - item.zz / 2) / scale
    );
    item.dis = box1;
    item.pos = [
      (boxes[i].cx - item.xx / 2) / scale,
      (boxes[i].cy + item.yy / 2) / scale,
      (boxes[i].cz - item.zz / 2) / scale,
    ];
    items.push(item);
    //  console.log(item);
    console.log(
      "item ",
      i + 1,
      " added at position: ",
      (boxes[i].cx - item.xx / 2) / scale,
      (boxes[i].cy + item.yy / 2) / scale,
      (boxes[i].cz - item.zz / 2) / scale
    );
  }

  return items;
}
