import * as THREE from 'three';
import { Entity } from './Entity';

/**
 * Basic first person camera
 */
export class FirstPersonCamera extends Entity<THREE.PerspectiveCamera> {
  constructor(camera: THREE.PerspectiveCamera) {
    super(camera);
  }
}
