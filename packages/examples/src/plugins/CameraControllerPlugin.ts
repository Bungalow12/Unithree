import ProcessorPlugin from '@unithree/core/dist/ProcessorPlugin';
import Unithree from '@unithree/core';
import { CameraController } from '../components';
import { Camera } from 'three';

class CameraControllerPlugin extends ProcessorPlugin {
  constructor() {
    super();
  }

  public update(deltaTime: number, isPaused: boolean): void {
    Unithree.getEntities().forEach((entity) => {
      entity.components.forEach((component) => {
        if (component instanceof CameraController<Camera>) {
          (component as CameraController<Camera>).onUpdate(deltaTime, isPaused);
        }
      });
    });
  }
}

export default CameraControllerPlugin;
