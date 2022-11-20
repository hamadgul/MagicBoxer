import { db } from './../firebase';

export function writeItemData(SKU, dim) {
  db.ref('items/' + SKU).set({
    length: dim[0],
    width: dim[1],
    height: dim[2]
  });
}
