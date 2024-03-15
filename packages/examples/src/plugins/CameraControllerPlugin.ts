import ProcessorPlugin, { ExecutionType } from 'unithree/dist/core/ProcessorPlugin';
import Unithree from 'unithree';
import { CameraController } from '../components';
import { Camera } from 'three';

class CameraControllerPlugin extends ProcessorPlugin {
  constructor() {
    super(ExecutionType.Always);
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
