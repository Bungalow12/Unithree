import * as THREE from 'three';
import { Entity } from 'unithree';

export class RotatingCube extends Entity {
  constructor(color: THREE.ColorRepresentation = 0x00ff00) {
    super();

    // Create our cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    this.add(cube);
  }

  public onUpdate(deltaTime: number, isPaused: boolean): this {
    super.onUpdate(deltaTime, isPaused);

    // Rotate the cube
    this.rotation.x += deltaTime * 10;
    this.rotation.y += deltaTime * 10;

    return this;
  }
}
