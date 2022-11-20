import * as THREE from 'three';
import suppressMetroWarnings from './suppressWarnings';
global.THREE = global.THREE || THREE;
// @ts-ignore
global.THREE['suppressExpoWarnings'] = suppressMetroWarnings;
// @ts-ignore
global.THREE['suppressMetroWarnings'] = suppressMetroWarnings;
export default THREE;
//# sourceMappingURL=Three.js.map