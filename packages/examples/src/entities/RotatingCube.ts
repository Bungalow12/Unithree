import { Entity } from 'unithree';
import { BoxGeometry, ColorRepresentation, Mesh, MeshStandardMaterial } from 'three';

export class RotatingCube extends Entity {
  constructor(color: ColorRepresentation = 0x00ff00) {
    super();

    // Create our cube
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color });
    const cube = new Mesh(geometry, material);
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
