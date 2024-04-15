import { Camera } from 'three';
import Component from '@unithree/core/Component';
import Entity from '@unithree/core/Entity';

export class CameraController<T extends Camera> implements Component {
  public entity: Entity | null = null;
  public camera: T;

  constructor(camera: T) {
    this.camera = camera;
  }

  public onUpdate(deltaTime: number, isPaused: boolean): void {}
}
