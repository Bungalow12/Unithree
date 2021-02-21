import { Object3D } from "./Types";
import { EngineObject } from "./EngineObject";

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class GameObject<T extends Object3D> extends EngineObject {
  object: T;

  constructor(object: T) {
    super();
    this.object = object;
  }
}
