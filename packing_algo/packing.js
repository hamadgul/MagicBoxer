// packing.js
import * as THREE from "three";
import { carrierBoxes } from './carrierBoxes';
import { createItemMesh } from '../utils/renderUtils';
import { RENDER_CONFIG } from '../utils/renderConfig';

//quicksort needed for itemList/boxList
function quickSort(arr, l, r) {
  if (l < r) {
    const pivot = r;
    const partIndex = partition(arr, pivot, l, r);
    quickSort(arr, l, partIndex - 1);
    quickSort(arr, partIndex + 1, r);
  }
  return arr;
}

function partition(arr, pivot, l, r) {
  const val = arr[pivot].vol;
  let partIndex = l;

  for (let i = l; i < r; i++) {
    if (arr[i].vol < val) {
      swap(arr, i, partIndex);
      partIndex++;
    }
  }
  swap(arr, r, partIndex);
  return partIndex;
}

function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

class Box {
  constructor(dims) {
    this.x = dims[0];
    this.y = dims[1] || 0;
    this.z = dims[2];
    this.type = dims[3] || "";
    this.priceText = dims[4] || "";
    this.cx = this.x / 2;
    this.cy = -this.y / 2;
    this.cz = this.z / 2;
    this.vol = this.x * this.y * this.z;
    this.items = [];
    this.parts = null;
    this.sec = [];
    this.remainvol = this.vol;

    if (isNaN(this.cy)) {
      console.error("Invalid y dimension", { y: this.y });
      this.cy = 0;
    }
  }
}

class Item {
  constructor(dims) {
    this.x = dims[0];
    this.y = dims[1] || 0;
    this.z = dims[2];
    this.xx = null;
    this.yy = null;
    this.zz = null;
    this.vol = this.x * this.y * this.z;
    this.dis = null;
    this.pos = null;
    this.sec = [];
    this.SKU = dims[3];
    this.color = "";
    this.itemName = dims[5];

    if (isNaN(this.y)) {
      console.error("Invalid y dimension in item", { y: this.y });
      this.y = 0;
    }
  }
}

//find the total volume of the list of items
function vol(itemList) {
  return itemList.reduce((tot, item) => tot + item.vol, 0);
}

//filter out the boxes that aren't big enough to hold all items
function filterVol(boxes, itemVol) {
  return boxes.filter(box => box.vol >= itemVol);
}

//make each dimension into an instance of the class
function initialize(boxes, items) {
  return {
    boxes: boxes.map(box => new Box(box)),
    items: items.map(item => new Item(item))
  };
}

//main packing function that will be called from the details screen
export function pack(itemList, carrier, optionalBox) {
  const boxSizes = optionalBox || carrierBoxes(carrier);
  const { boxes, items } = initialize(boxSizes, itemList);
  const itemVol = vol(items);
  const filteredBoxes = filterVol(boxes, itemVol);
  
  if (filteredBoxes.length === 0) {
    return new Box([12, 12, 12, "No Box Found", 
      `No suitable box found in ${carrier}'s standard sizes. Try a different carrier or split the items between multiple boxes.`]);
  }

  const sortedItems = quickSort([...items], 0, items.length - 1).reverse();
  const sortedBoxes = quickSort(filteredBoxes, 0, filteredBoxes.length - 1);
  const finalBox = findBox(sortedItems, sortedBoxes, 0);
  
  if (finalBox === "No boxes found") {
    return new Box([12, 12, 12, "No Box Found", 
      `No suitable box found in ${carrier}'s standard sizes. Try a different carrier or split the items between multiple boxes.`]);
  }
  
  return finalBox;
}

//iterate through the list of items to add each one to the box. moves to next box if any items fail to be placed in a box. returns finalized box
function findBox(itemList, boxSizes, j) {
  if (j >= boxSizes.length) {
    return "No boxes found";
  }
  const currentBox = boxSizes[j];
  for (let i = 0; i < itemList.length; i++) {
    const b = fitItem(itemList[i], currentBox);
    if (!b) {
      return findBox(itemList, boxSizes, j + 1);
    }
  }
  return finalize(currentBox);
}

//doesn't work completely; this function will take the resulting box object and unnest the boxes inside. This will tell us the positions of each item in the main box.
function finalize(aBox) {
  if (!aBox.parts) {
    return aBox;
  }

  for (let i = aBox.parts.length - 1; i >= 0; i--) {
    const part = aBox.parts[i];
    if (part.items.length) {
      aBox.items = aBox.items.concat(part.items);
      aBox.remainvol -= vol(part.items);
    }
  }
  return aBox;
}

//split the box into the biggest possible boxes. general (not optimal) approach is to split it up into 3 boxes: the space above the current item, and two resulting boxes next to the item
function splitBox(item, curbox) {
  curbox.items.push(item);
  item.sec = [...curbox.sec];
  curbox.remainvol -= item.vol;
  
  const bx = curbox.x - item.xx;
  const by = curbox.y - item.yy;
  const bz = curbox.z - item.zz;
  const boxes = [];

  if (by !== 0) {
    const box1 = new Box([item.xx, by, item.zz]);
    Object.assign(box1, {
      cx: curbox.cx,
      cy: curbox.cy + item.yy,
      cz: curbox.cz,
      sec: [...curbox.sec, "upper"]
    });
    boxes.push(box1);
  }

  if (bx !== 0) {
    const box2 = new Box([bx, curbox.y, curbox.z]);
    Object.assign(box2, {
      cx: curbox.cx - item.xx,
      cy: curbox.cy,
      cz: curbox.cz,
      sec: [...curbox.sec, "side"]
    });
    boxes.push(box2);
  }

  if (bz !== 0) {
    const box3 = new Box([item.xx, curbox.y, bz]);
    Object.assign(box3, {
      cx: curbox.cx,
      cy: curbox.cy,
      cz: curbox.cz - item.zz,
      sec: [...curbox.sec, "behind"]
    });
    boxes.push(box3);
  }

  return boxes;
}

//truly checks if the item fits in the box. If the item's volume is greater than the remaining volume, immediately return false
//else, rotate the item as much as it can until it fits inside the box. once it fits, split the resulting box, and return true
//if there was no rotation where the item will fit, we also return false
function checkDimensions(item, box) {
  if (item.vol > box.remainvol) {
    return false;
  } else {
    for (let rotation = 1; rotation <= 6; rotation++) {
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
      }

      if (item.xx <= box.x && item.yy <= box.y && item.zz <= box.z) {
        box.parts = splitBox(item, box);
        return true;
      }
    }
    return false;
  }
}

//checks to see if the item will fit inside the box. checks if the box is split up at all. if it isn't, run checkDimensions. If it is split, run this function recursively until it finds
//the boxes that haven't been split and work back from there. we always return the result of checkDimensions, but if the item does fit, we want to stop seaching and immediately return.
function fitItem(item, box) {
  if (!box.parts) {
    return checkDimensions(item, box);
  } else {
    for (let i = 0; i < box.parts.length; i++) {
      const r = fitItem(item, box.parts[i]);
      if (r) {
        return r;
      }
    }
    return false;
  }
}

function helper(ob, a) {
  if (Array.isArray(ob.items) && ob.items.length !== 0) {
    a.push(ob);

    if (Array.isArray(ob.parts)) {
      for (let i = 0; i < ob.parts.length; i++) {
        helper(ob.parts[i], a);
      }
    } else {
      console.warn("ob.parts is not an array or is undefined:", ob.parts);
    }
  }
  return a;
}

export function flatten2(ob) {
  const a = [];
  helper(ob, a);
  return a;
}

export function test(box) {
  return [box.x, box.y, box.z];
}

export function createDisplay(box, scale) {
  const boxes = flatten2(box);
  const items = [];
  const difcolors = [
    "#FF5733", // Bright Orange-Red
    "#2DAE42", // Green
    "#63D7D6", // Light Cyan
    "#FF7F50", // Coral
    "#4682B4", // Steel Blue
    "#9B59B6", // Amethyst Purple
    "#FFD700", // Gold
    "#40E0D0", // Turquoise
    "#DC143C", // Crimson Red
    "#32CD32", // Lime Green
    "#FF4500", // Orange Red
    "#1E90FF", // Dodger Blue
    "#DA70D6", // Orchid
    "#8A2BE2", // Blue Violet
    "#FF1493", // Deep Pink
  ];

  for (let i = 0; i < boxes.length; i++) {
    const item = boxes[i].items[0];
    if (item) {
      const itemScale = scale;
      
      // Ensure item dimensions are set before creating geometry
      if (!item.xx || !item.yy || !item.zz) {
        item.xx = item.x;
        item.yy = item.y;
        item.zz = item.z;
      }

      const geo = new THREE.BoxGeometry(
        item.xx / itemScale - 0.001,
        item.yy / itemScale - 0.001,
        item.zz / itemScale - 0.001
      );
      const mat = new THREE.MeshBasicMaterial({
        color: difcolors[i % difcolors.length],
        opacity: 1,
        visible: true,
      });
      item.color = difcolors[i % difcolors.length];
      const box1 = new THREE.Mesh(geo, mat);

      // Add edges with light white color
      const edges = new THREE.EdgesGeometry(geo);
      const edgeMaterial = new THREE.LineBasicMaterial(RENDER_CONFIG.item.wireframe);
      const wireframe = new THREE.LineSegments(edges, edgeMaterial);
      box1.add(wireframe);

      // Ensure box center coordinates are set
      if (typeof boxes[i].cx === 'undefined') boxes[i].cx = boxes[i].x / 2;
      if (typeof boxes[i].cy === 'undefined') boxes[i].cy = -boxes[i].y / 2;
      if (typeof boxes[i].cz === 'undefined') boxes[i].cz = boxes[i].z / 2;

      box1.position.set(
        (boxes[i].cx - item.xx / 2) / scale,
        (boxes[i].cy + item.yy / 2) / scale,
        (boxes[i].cz - item.zz / 2) / scale
      );
      item.dis = box1;
      item.pos = [
        boxes[i].cx - item.xx / 2,
        boxes[i].cy + item.yy / 2,
        boxes[i].cz - item.zz / 2,
      ];
      item.boxType = boxes[i].type;

      items.push({
        ...item,
        itemName: item.itemName || "Unnamed Item",
      });
    } else {
      console.warn("No item found in box:", boxes[i]);
    }
  }

  return items;
}