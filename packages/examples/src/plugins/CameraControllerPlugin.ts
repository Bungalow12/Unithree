import ProcessorPlugin from '@unithree/core/ProcessorPlugin';
import Unithree from '@unithree/core';
import { CameraController } from '../components';
import { Camera } from 'three';
import Entity from '@unithree/core/Entity';
import Component from '@unithree/core/Component';

class CameraControllerPlugin extends ProcessorPlugin {
  constructor() {
    super();
  }

  public update(deltaTime: number, isPaused: boolean): void {
    Unithree.getEntities().forEach((entity: Entity) => {
      entity.components.forEach((component: Component) => {
        if (component instanceof CameraController<Camera>) {
          (component as CameraController<Camera>).onUpdate(deltaTime, isPaused);
        }
      });
    });
  }
}

export default CameraControllerPlugin;
