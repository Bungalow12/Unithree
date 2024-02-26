import * as THREE from 'three';
import { Entity, UnithreeState } from '../../src';

export class RotatingCube extends Entity {
  constructor() {
    super();

    // Create our cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const cube = new THREE.Mesh(geometry, material);

    UnithreeState.instantiateObject(cube, this);
  }

  public onUpdate(deltaTime: number, isPaused: boolean): this {
    super.onUpdate(deltaTime, isPaused);

    // Rotate the cube
    this.rotation.x += deltaTime;
    this.rotation.y += deltaTime;

    return this;
  }
}
