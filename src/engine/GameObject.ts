import { Object3D } from "./Types";

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class GameObject<T extends Object3D = Object3D> {
  protected readonly _object: T;

  constructor(object: T) {
    this._object = object;

    this.update = this.update.bind(this);
  }

  /**
   * Updates is called once per frame
   * @param delta the time since the last update
   */
  update(delta: number): void {
    // Do nothing by default
  }

  /**
   * Gets the underlying rendering object
   * @returns {T}
   */
  get object(): T {
    return this._object;
  }
}
