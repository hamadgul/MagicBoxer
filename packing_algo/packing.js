// packing.js
import * as THREE from "three";

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
  this.type = dims[5]; // Add type of the box
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
// Generate the box sizes for the specific carrier
// Generate the box sizes for the specific carrier
function carrierBoxes(carrier) {
  switch (carrier) {
    case "USPS":
      return [
        [8.6875, 5.4375, 1.75, 0, false, "Priority Mail Flat Rate Small Box"],
        [
          11.25,
          8.75,
          6,
          0,
          false,
          "Priority Mail Express Side-Loading Medium Box Option 1",
        ],
        [
          14.125,
          12,
          3.5,
          0,
          false,
          "Priority Mail Flat Rate Side-Loading Medium Box",
        ],
        [12.25, 12, 6, 0, false, "Priority Mail Flat Rate Large Box"],
        [14.875, 5.25, 7.375, 0, false, "Priority Mail Shoe Box"],
        [13.6875, 12, 2.875, 0, false, "Priority Mail Medium Box 1"],
        [8.75, 5.5625, 0.875, 0, false, "Priority Mail DVD Box"],
        [38.0625, 6.25, 4.25, 0, false, "Priority Mail Medium Tube Box"],
        [9.4375, 6.4375, 2.1875, 0, false, "Priority Mail Small Box"],
        [
          14.125,
          12,
          3.5,
          0,
          false,
          "Priority Mail Flat Rate Side-Loading Medium Box",
        ],
        [12.25, 12, 8.5, 0, false, "Priority Mail Large Box"],
        [25.5625, 6, 5.25, 0, false, "Priority Mail Small Tube Box"],
        [7.25, 7.25, 6.5, 0, false, "Priority Mail Medium Cube-Shaped Box"],
        [11.75, 8.75, 5.75, 0, false, "Priority Mail Express Medium Box"],
        [13.4375, 11.625, 2.5, 0, false, "Priority Mail Medium Box 2"],
      ];
    case "FedEx":
      return [
        [10.875, 1.5, 12.375, 0, false, "FedEx Small Box"],
        [8.75, 2.625, 11.25, 0, false, "FedEx Small Box"],
        [11.5, 2.375, 13.25, 0, false, "FedEx Medium Box"],
        [8.75, 2.625, 11.25, 0, false, "FedEx Medium Box"],
        [12, 3, 17.5, 2.25, false, "Standard"],
        [17, 17, 7, 3.25, false, "Standard"],
        [12, 9, 6, 2, false, "Standard"],
        [20, 20, 12, 4.5, false, "Standard"],
        [13, 9, 11, 2.75, false, "Standard"],
        [23, 17, 12, 4.75, false, "Standard"],
        [8, 8, 8, 1.75, false, "Standard"],
        [11, 11, 11, 2.5, false, "Standard"],
        [24, 24, 24, 12, false, "Heavy-duty Double-Walled Box"],
        [14, 14, 14, 3.75, false, "Standard"],
        [28, 28, 28, 15, false, "Heavy-duty Double-Walled Box"],
        [16, 16, 16, 4.29, false, "Standard"],
        [12, 12, 18, 3.75, false, "Standard"],
        [20, 20, 20, 6.29, false, "Standard"],
        [22, 22, 22, 7, false, "Standard"],
        [24, 24, 18, 10, false, "Heavy-duty Double-Walled Box"],
        [18, 13, 11.75, 7, false, "Heavy-duty Double-Walled Box"],
        [9.5, 12.5, 1, 0, false, "Reusable Envelope"],
        [9.5, 15.5, 1, 0, false, "Reusable Envelope"],
        [9.75, 11.5, 1, 0, false, "Reusable Envelope"],
        [10.25, 12.75, 1, 0, false, "FedEx Small Pak"],
        [12, 15.5, 3, 0, false, "FedEx Large Pak"],
        [11.75, 14.75, 1.5, 0, false, "FedEx Pak Padded"],
        [6, 6, 38, 0, false, "FedEx Tube"],
        [15, 15, 48, 14, false, "Golf Bag Box"],
        [50, 9, 9, 7.5, false, "Golf Club Tube"],
        [54, 8, 28, 16, false, "Bike Box"],
        [20, 8, 50, 14, false, "Guitar Box"],
        [38, 8, 26, 15, false, "Flat-Panel Small TV Box"],
        [46, 8, 30, 20, false, "Flat-Panel Medium TV Box"],
        [56, 8, 36, 28, false, "Flat Panel Large TV Box"],
        [6.25, 3.125, 0.5, 8, false, "Small Electronics Box"],
        [10.4375, 7.5, 1, 10, false, "Tablet Box"],
        [21, 16, 5, 20, false, "Laptop Box with Kit"],
      ];
    case "UPS":
      return [
        [6, 6, 6, 0, false, "Standard"],
        [6, 6, 48, 0, false, "Standard"],
        [8, 8, 8, 0, false, "Standard"],
        [10, 10, 10, 0, false, "Standard"],
        [12, 12, 6, 0, false, "Standard"],
        [12, 12, 12, 0, false, "Standard"],
        [14, 14, 14, 0, false, "Standard"],
        [15, 12, 10, 0, false, "Standard"],
        [15, 15, 48, 0, false, "Standard"],
        [16, 16, 4, 0, false, "Standard"],
        [16, 16, 16, 0, false, "Standard"],
        [17, 11, 8, 0, false, "Standard"],
        [18, 18, 18, 0, false, "Standard"],
        [20, 12, 12, 0, false, "Standard"],
        [20, 20, 12, 0, false, "Standard"],
        [20, 20, 20, 0, false, "Standard"],
        [24, 18, 6, 0, false, "Standard"],
        [24, 18, 18, 0, false, "Standard"],
        [24, 24, 16, 0, false, "Standard"],
        [24, 24, 24, 0, false, "Standard"],
        [30, 24, 6, 0, false, "Standard"],
      ];
    case "No Carrier":
      return [
        [9, 6, 3, 0.75, false, "Small Mailing Box"],
        [11, 8.5, 5.5, 1, false, "Medium Mailing Box"],
        [12, 12, 8, 1.25, false, "Large Mailing Box"],
        [14, 14, 14, 2, false, "Extra Large Mailing Box"],
        [10, 7, 3, 0.75, false, "Letter Box"],
        [15, 12, 10, 1.25, false, "Legal Box, File Box"],
        [16, 12, 12, 1.75, false, "Small Moving Box, Small Box"],
        [18, 18, 16, 2.5, false, "Medium Moving Box, Medium Box"],
        [20, 20, 15, 3.25, false, "Large Moving Box"],
        [23, 23, 16, 4, false, "Extra Large Moving Box"],
        [14, 8, 5, 1, false, "Shoe Box"],
        [24, 20, 46, 15, false, "Wardrobe Box"],
        [8.625, 5.375, 1.625, 1, false, "Small Flat Rate Box (USPS)"],
        [11.25, 8.75, 6, 1.25, false, "Medium Flat Rate Box (USPS)"],
        [12.25, 12.25, 6, 1.5, false, "Large Flat Rate Box (USPS)"],
        [40, 48, 36, 40, false, "Standard Pallet Box"],
        [18, 14, 14, 2.5, false, "Medium Box"],
        [24, 18, 18, 3.75, false, "Large Box"],
        [24, 20, 20, 4.5, false, "Extra Large Box"],
        [24, 24, 24, 5, false, "Extra Large Box"],
        [18, 18, 28, 5.5, false, "Dish Pack Box"],
        [24, 24, 40, 15, false, "Wardrobe Box"],
        [37, 4, 27, 4.5, false, "Flat Box (for artwork and mirrors)"],
        [16, 12, 10, 2.25, false, "Banker Box"],
        [18, 18, 24, 5, false, "Heavy-Duty Box"],
      ];
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
    console.log("Final Box Type: ", aBox.type); // Check the box type here
    return aBox;
  } else {
    for (var i = aBox.parts.length - 1; i >= 0; i--) {
      if (aBox.parts[i].items != []) {
        aBox.items.concat(aBox.parts[i].items);
        aBox.remainvol -= vol(aBox.parts[i].items);
      }
    }
    console.log("Final Box Type After Parts: ", aBox.type); // Check the box type again
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
  // Ensure 'ob.items' is defined and is an array
  if (Array.isArray(ob.items) && ob.items.length !== 0) {
    a.push(ob);

    // Ensure 'ob.parts' is defined and is an array before iterating
    if (Array.isArray(ob.parts)) {
      for (var i = 0; i < ob.parts.length; i++) {
        helper(ob.parts[i], a);
      }
    } else {
      console.warn("ob.parts is not an array or is undefined:", ob.parts);
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
    item.boxType = boxes[i].type; // Include box type
    items.push(item);
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

export { carrierBoxes };
