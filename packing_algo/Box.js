export default class Box {
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
