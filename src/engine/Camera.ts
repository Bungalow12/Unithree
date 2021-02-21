import * as THREE from "three";
import { GameObject } from "./GameObject";

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class Camera extends GameObject<THREE.Camera> {
  constructor(object: THREE.Camera) {
    super(object);
  }

  getCameraAs = <T extends THREE.Camera>(): T => {
    return this._object as T;
  };
}
