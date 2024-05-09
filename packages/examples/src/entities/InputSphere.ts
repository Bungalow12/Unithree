import { ColorRepresentation, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import Unithree from '@unithree/core';
import Entity from '@unithree/core/Entity';
import Input from '@unithree/core/plugin/Input';

export class InputSphere extends Entity {
  private input: Input | null = null;

  constructor(color: ColorRepresentation = 0xffffff) {
    super();

    // Create our cube
    const geometry = new SphereGeometry(15, 32, 16);
    const material = new MeshStandardMaterial({ color });
    const sphere = new Mesh(geometry, material);
    this.add(sphere);
  }

  public onStart(deltaTime: number, isPaused: boolean): this {
    super.onStart(deltaTime, isPaused);
    this.input = Unithree.getPluginByTypeName<Input>('Input');
    return this;
  }

  public onUpdate(deltaTime: number, isPaused: boolean): this {
    super.onUpdate(deltaTime, isPaused);

    if (this.input?.getKeyDown('ArrowUp') || this.input?.getKeyDown('w')) {
      this.position.y += 1;
    } else if (this.input?.getKeyDown('ArrowDown') || this.input?.getKeyDown('s')) {
      this.position.y -= 1;
    }

    if (this.input?.getKeyDown('ArrowLeft') || this.input?.getKeyDown('a')) {
      this.position.x -= 1;
    } else if (this.input?.getKeyDown('ArrowRight') || this.input?.getKeyDown('d')) {
      this.position.x += 1;
    }

    return this;
  }
}
