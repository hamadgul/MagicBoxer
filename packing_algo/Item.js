export default class Item {
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
