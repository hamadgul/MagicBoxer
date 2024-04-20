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
  var boxSizes;
  if (optionalBox != 0) {
    boxSizes = optionalBox;
  } else {
    boxSizes = carrierBoxes(carrier);
  }
  initialize(boxSizes, itemList);
  var itemVol;
  itemVol = vol(itemList);
  boxSizes = filterVol(boxSizes, itemVol);
  if (boxSizes.length === 0) {
    return 0;
  }
  itemList = quickSort(itemList, 0, itemList.length - 1).reverse();
  boxSizes = quickSort(boxSizes, 0, boxSizes.length - 1);
  finalBox = findBox(itemList, boxSizes, 0);
  return finalBox;
}

//generate the box sizes for the specific carrier
function carrierBoxes(carrier) {
  switch (carrier) {
    case "USPS":
      return [
        [4, 4, 4],
        [5, 5, 5],
        [3, 4, 6],
        [8.625, 5.275, 1.625],
        [11, 8.5, 5.5],
        [13.625, 11.875, 3.375],
        [12, 12, 5.5],
        [10.875, 1.5, 12.375],
        [8.75, 11.6875, 11.3125],
        [11.5, 2.375, 13.25],
        [8.75, 4.375, 11.3125],
        [12.375, 3, 17.5],
        [8.75, 7.75, 11.3125],
        [11.875, 10.8125, 11.0625],
        [15.75, 14.1875, 6],
        [13, 11, 2],
        [16, 11, 3],
        [18, 13, 3],
        [18, 12.5, 3],
        [17, 17, 7],
        [12, 9, 6],
        [20, 20, 12],
        [13, 9, 11],
        [23, 17, 12],
        [12, 12, 18],
        [8, 8, 8],
        [20, 20, 20],
        [11, 11, 11],
        [24, 24, 24],
        [14, 14, 14],
        [28, 28, 28],
        [16, 16, 16],
      ];
      break;
    case "FEDEX":
      return [
        [10.875, 1.5, 12.375],
        [8.75, 11.6875, 11.3125],
        [11.5, 2.375, 13.25],
        [8.75, 4.375, 11.3125],
        [12.375, 3, 17.5],
        [8.75, 7.75, 11.3125],
        [11.875, 10.8125, 11.0625],
        [15.75, 14.1875, 6],
        [18, 12.5, 3],
        [17, 17, 7],
        [12, 9, 6],
        [20, 20, 12],
        [13, 9, 11],
        [23, 17, 12],
        [12, 12, 18],
        [8, 8, 8],
        [20, 20, 20],
        [11, 11, 11],
        [24, 24, 24],
        [14, 14, 14],
        [28, 28, 28],
        [16, 16, 16],
      ];
      break;
    case "UPS":
      return [
        [13, 11, 2],
        [16, 11, 3],
        [18, 13, 3],
        [18, 12.5, 3],
        [17, 17, 7],
        [12, 9, 6],
        [20, 20, 12],
        [13, 9, 11],
        [23, 17, 12],
        [12, 12, 18],
        [8, 8, 8],
        [20, 20, 20],
        [11, 11, 11],
        [24, 24, 24],
        [14, 14, 14],
        [28, 28, 28],
        [16, 16, 16],
      ];
      break;
    default:
      return [
        [18, 12.5, 3],
        [17, 17, 7],
        [12, 9, 6],
        [20, 20, 12],
        [13, 9, 11],
        [23, 17, 12],
        [12, 12, 18],
        [8, 8, 8],
        [20, 20, 20],
        [11, 11, 11],
        [24, 24, 24],
        [14, 14, 14],
        [28, 28, 28],
        [16, 16, 16],
      ];
      break;
  }
}

//iterate through the list of items to add each one to the box. moves to next box if any items fail to be placed in a box. returns finalized box
function findBox(itemList, boxSizes, j) {
  if (j >= boxSizes.length) {
    return "No boxes found";
  }
  currentBox = boxSizes[j];
  for (var i = 0; i < itemList.length; i++) {
    var b = fitItem(itemList[i], currentBox);
    if (!b) {
      return findBox(itemList, boxSizes, j + 1);
    }
  }
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
function checkDimensions(item, box) {
  var fits = false;
  if (item.vol > box.remainvol) {
    return fits;
  } else {
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
      }

      if (item.xx <= box.x && item.yy <= box.y && item.zz <= box.z) {
        fits = true;
        box.parts = splitBox(item, box);
        return fits;
      }
    }
    return fits;
  }
}
//checks to see if the item will fit inside the box. checks if the box is split up at all. if it isn't, run checkDimensions. If it is split, run this function recursively until it finds
//the boxes that haven't been split and work back from there. we always return the result of checkDimensions, but if the item does fit, we want to stop seaching and immediately return.
function fitItem(item, box) {
  if (box.parts == null) {
    return checkDimensions(item, box);
  } else {
    var r;
    for (var i = 0; i < box.parts.length; i++) {
      r = fitItem(item, box.parts[i]);
      if (r) {
        return r;
      }
    }
    if (!r) {
      return r;
    }
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
