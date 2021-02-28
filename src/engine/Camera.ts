import * as THREE from 'three';
import { GameObject } from './GameObject';

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class Camera<T extends THREE.Camera = THREE.Camera> extends GameObject<T> {
  constructor(object: T) {
    super(object);
  }
}
