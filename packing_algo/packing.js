// packing.js
import * as THREE from "three";

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

// Generate the box sizes for the specific carrier
function carrierBoxes(carrier) {
  switch (carrier) {
    case "No Carrier":
      return [
        [6, 4, 2, "Small Box", "Estimated Box Only Price: $0.95"],
        [6, 6, 6, "Small Box", "Estimated Box Only Price: $0.95"],
        [9, 6, 3, "Small Mailing Box", "Estimated Box Only Price: $0.75"],
        [11, 8.5, 5.5, "Medium Mailing Box", "Estimated Box Only Price: $1.00"],
        [12, 12, 8, "Large Mailing Box", "Estimated Box Only Price: $1.25"],
        [14, 14, 14, "Extra Large Mailing Box", "Estimated Box Only Price: $2.00"],
        [10, 7, 3, "Letter Box", "Estimated Box Only Price: $0.75"],
        [15, 12, 10, "Legal/File Box", "Estimated Box Only Price: $1.25"],
        [16, 12, 12, "Small Moving Box", "Estimated Box Only Price: $1.75"],
        [18, 18, 16, "Medium Moving Box", "Estimated Box Only Price: $2.50"],
        [20, 14, 6, "Medium Moving Box", "Estimated Box Only Price: $2.40"],
        [24, 18, 12, "Medium Moving Box", "Estimated Box Only Price: $3.85"],
        [18, 18, 18, "Large Moving Box", "Estimated Box Only Price: $3.90"],
        [20, 20, 20, "Large Moving Box", "Estimated Box Only Price: $6.95"],
        [30, 24, 18, "Large Moving Box", "Estimated Box Only Price: $10.99"],
        [36, 24, 12, "Large Moving Box", "Estimated Box Only Price: $9.90"],
        [36, 36, 36, "Large Moving Box", "Estimated Box Only Price: $17.95"],
        [9, 12, 2, "Flat Box", "Estimated Box Only Price: $1.25"],
        [12, 12, 1, "Flat Box", "Estimated Box Only Price: $1.35"],
        [18, 12, 4, "Flat Box", "Estimated Box Only Price: $2.15"],
        [20, 16, 2, "Flat Box", "Estimated Box Only Price: $2.40"],
        [24, 24, 6, "Flat Box", "Estimated Box Only Price: $4.99"],
        [6.25, 3.125, 0.5, "Small Electronics Box", "Contact Carrier For Price"],
        [9.5, 12.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [9.5, 15.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [9.75, 11.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [10.25, 12.75, 1, "FedEx Pak", "FedEx One Rate: From $10.95"],
        [12, 15.5, 3, "FedEx Large Pak", "FedEx One Rate: From $11.95"],
        [11.75, 14.75, 1.5, "FedEx Pak Padded", "FedEx One Rate: From $11.95"],
        [6, 6, 38, "FedEx Tube", "FedEx One Rate: From $22.85"],
        [15, 15, 48, "Golf Bag Box", "Contact Carrier For Price"],
        [50, 9, 9, "Golf Club Tube", "Contact Carrier For Price"],
        [54, 8, 28, "Bike Box", "Contact Carrier For Price"],
        [20, 8, 50, "Guitar Box", "Contact Carrier For Price"],
        [38, 8, 26, "Flat-Panel Small TV Box", "Contact Carrier For Price"],
        [46, 8, 30, "Flat-Panel Medium TV Box", "Contact Carrier For Price"],
        [56, 8, 36, "Flat Panel Large TV Box", "Contact Carrier For Price"],
        [6.25, 3.125, 0.5, "Small Electronics Box", "Contact Carrier For Price"],
      ];
    case "USPS":
      return [
        [8.6875, 5.4375, 1.75, "Priority Mail Flat Rate Small Box", "Priority Mail from: $11.00+"],
        [
          11.25,
          8.75,
          6,
          "Priority Mail Express Side-Loading Medium Box Option 1",
          "Priority Mail Express: $31.55+"
        ],
        [
          14.125,
          12,
          3.5,
          "Priority Mail Flat Rate Side-Loading Medium Box",
          "Priority Mail from: $11.00+"
        ],
        [12.25, 12, 6, "Priority Mail Flat Rate Large Box", "Priority Mail from: $11.00+"],
        [14.875, 5.25, 7.375, "Priority Mail Shoe Box", "Priority Mail from: $11.00+"],
        [13.6875, 12, 2.875, "Priority Mail Medium Box 1", "Priority Mail from: $11.00+"],
        [8.75, 5.5625, 0.875, "Priority Mail DVD Box", "Priority Mail from: $11.00+"],
        [38.0625, 6.25, 4.25, "Priority Mail Medium Tube Box", "Priority Mail from: $11.00+"],
        [9.4375, 6.4375, 2.1875, "Priority Mail Small Box", "Priority Mail from: $11.00+"],
        [
          14.125,
          12,
          3.5,
          "Priority Mail Flat Rate Side-Loading Medium Box",
          "Priority Mail from: $11.00+"
        ],
        [12.25, 12, 8.5, "Priority Mail Large Box", "Priority Mail from: $11.00+"],
        [25.5625, 6, 5.25, "Priority Mail Small Tube Box", "Priority Mail from: $11.00+"],
        [7.25, 7.25, 6.5, "Priority Mail Medium Cube-Shaped Box", "Priority Mail from: $11.00+"],
        [11.75, 8.75, 5.75, "Priority Mail Express Medium Box", "Priority Mail Express: $31.55+"],
        [13.4375, 11.625, 2.5, "Priority Mail Medium Box 2", "Priority Mail from: $11.00+"],
      ];
    case "FedEx":
      return [
        [10.875, 1.5, 12.375, "FedEx Small Box", "FedEx One Rate: From $12.95"],
        [8.75, 2.625, 11.25, "FedEx Small Box", "FedEx One Rate: From $12.95"],
        [11.5, 2.375, 13.25, "FedEx Medium Box", "FedEx One Rate: From $18.25"],
        [8.75, 2.625, 11.25, "FedEx Medium Box", "FedEx One Rate: From $18.25"],
        [8.75, 4.375,11.25, "FedEx Medium Box", "FedEx One Rate: From $18.25"],
        [12, 3, 17.5, "FedEx Large Box", "FedEx One Rate: From $24.45"],
        [17, 17, 7, "FedEx Large Box", "FedEx One Rate: From $24.45"],
        [12, 9, 6, "FedEx Extra Large Box", "FedEx One Rate: From $32.50"],
        [20, 20, 12, "FedEx Extra Large Box", "FedEx One Rate: From $32.50"],
        [13, 9, 11, "FedEx Extra Large Box", "FedEx One Rate: From $32.50"],
        [23, 17, 12, "Standard", "Contact Carrier For Price"],
        [24, 24, 24, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [14, 14, 14, "Standard", "Contact Carrier For Price"],
        [28, 28, 28, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [16, 16, 16, "Standard", "Contact Carrier For Price"],
        [32, 32, 32, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [18, 18, 18, "Standard", "Contact Carrier For Price"],
        [36, 36, 36, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [20, 20, 20, "Standard", "Contact Carrier For Price"],
        [40, 40, 40, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [22, 22, 22, "Standard", "Contact Carrier For Price"],
        [44, 44, 44, "Heavy-duty Double-Walled Box", "Contact Carrier For Price"],
        [50, 9, 9, "Golf Club Tube", "Contact Carrier For Price"],
        [54, 8, 28, "Bike Box", "Contact Carrier For Price"],
        [20, 8, 50, "Guitar Box", "Contact Carrier For Price"],
        [38, 8, 26, "Flat-Panel Small TV Box", "Contact Carrier For Price"],
        [46, 8, 30, "Flat-Panel Medium TV Box", "Contact Carrier For Price"],
        [56, 8, 36, "Flat Panel Large TV Box", "Contact Carrier For Price"],
        [6.25, 3.125, 0.5, "Small Electronics Box", "Contact Carrier For Price"],
        [9.5, 12.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [9.5, 15.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [9.75, 11.5, 1, "FedEx Envelope", "FedEx One Rate: From $9.95"],
        [10.25, 12.75, 1, "FedEx Pak", "FedEx One Rate: From $10.95"],
        [12, 15.5, 3, "FedEx Large Pak", "FedEx One Rate: From $11.95"],
        [11.75, 14.75, 1.5, "FedEx Pak Padded", "FedEx One Rate: From $11.95"],
        [6, 6, 38, "FedEx Tube", "FedEx One Rate: From $22.85"],
        [15, 15, 48, "Golf Bag Box", "Contact Carrier For Price"],
        [50, 9, 9, "Golf Club Tube", "Contact Carrier For Price"],
        [54, 8, 28, "Bike Box", "Contact Carrier For Price"],
        [20, 8, 50, "Guitar Box", "Contact Carrier For Price"],
        [38, 8, 26, "Flat-Panel Small TV Box", "Contact Carrier For Price"],
        [46, 8, 30, "Flat-Panel Medium TV Box", "Contact Carrier For Price"],
        [56, 8, 36, "Flat Panel Large TV Box", "Contact Carrier For Price"],
        [6.25, 3.125, 0.5, "Small Electronics Box", "Contact Carrier For Price"],
      ];
    case "UPS":
      return [
        [6, 6, 6, "Small Box","Flat Rates Start at $14.90"],
        [6, 6, 48, "Extra Large Box", "Flat Rates Start at $29.25"],
        [8, 8, 8, "Medium Box", "Flat Rates Start at $17.85"],
        [10, 10, 10, "Large Box","Flat Rates Start at $23.50"],
        [12, 12, 6, "Large Box","Flat Rates Start at $23.50"],
        [12, 12, 12, "Extra Large Box","Flat Rates Start at $29.25"],
        [14, 14, 14, "Standard"],
        [15, 12, 10, "Extra Large Box","Flat Rates Start at $29.25"],
        [15, 15, 48, "Standard"],
        [16, 16, 4, "Large Box", "Flat Rates Start at $23.50"],
        [16, 16, 16, "Standard"],
        [17, 11, 8, "Extra Large Box", "Flat Rates Start at $29.25"],
        [18, 18, 18, "Standard"],
        [20, 12, 12, "Standard"],
        [20, 20, 12, "Standard"],
        [20, 20, 20, "Standard"],
        [24, 18, 6, "Standard"],
        [24, 18, 18, "Standard"],
        [24, 24, 16, "Standard"],
        [24, 24, 24, "Standard"],
        [30, 24, 6, "Standard"],
        // Additional Standard Retail Box Sizes
        [8, 6, 4, "Extra Small Box", "Flat Rates Start at $14.90"],
        [13, 11, 2, "Small Document Box", "Flat Rates Start at $14.90"],
        [13, 11, 4, "Small Box", "Flat Rates Start at $14.90"],
        [16, 13, 3, "Medium Document Box", "Flat Rates Start at $17.85"],
        [15, 11, 11, "Medium Box", "Flat Rates Start at $17.85"],
        [18, 13, 16, "Large Box", "Flat Rates Start at $23.50"],
        [17, 17, 17, "Large Box", "Flat Rates Start at $23.50"],
        [24, 18, 18, "Extra Large Box", "Flat Rates Start at $29.25"],
        [24, 24, 18, "Extra Large Box", "Flat Rates Start at $29.25"]
      ];
    default:
      return [
        [12, 12, 12, "Standard box", "Contact carrier for price"]
      ];
  }
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
      const isSpecialSize = (
        (box.x === 12 && box.y === 15.5 && box.z === 3) ||
        (box.x === 17 && box.y === 11 && box.z === 8) ||
        (box.x === 17 && box.y === 17 && box.z === 7) ||
        (box.x === 8 && box.y === 6 && box.z === 4) ||
        (box.x === 16 && box.y === 13 && box.z === 3) ||
        (box.x === 9 && box.y === 6 && box.z === 3) ||
        // General rules for small boxes
        (Math.max(box.x, box.y) <= 9 && Math.min(box.x, box.y, box.z) <= 4) ||
        (Math.min(box.x, box.y, box.z) <= 4 && Math.max(box.x, box.y) >= 8)
      );

      const itemScale = isSpecialSize ? 12 : scale;
      
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
        (boxes[i].cx - item.xx / 2) / scale,
        (boxes[i].cy + item.yy / 2) / scale,
        (boxes[i].cz - item.zz / 2) / scale,
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

export { carrierBoxes };