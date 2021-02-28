import * as THREE from 'three';
import { Object3D, Vector3 } from './Types';

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class GameObject<T extends Object3D = Object3D> {
  protected readonly _object: T;

  constructor(object: T) {
    this._object = object;

    this.update = this.update.bind(this);

    this.moveTo = this.moveTo.bind(this);
    this.lookAt = this.lookAt.bind(this);
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

  /**
   * Moves an object to a specified location
   * @param {Vector3 | Object3D | GameObject} target
   */
  moveTo(target: Vector3 | Object3D | GameObject): void {
    if (target instanceof THREE.Vector3) {
      this.object.position.copy(target);
    } else if (target instanceof THREE.Object3D) {
      this.object.position.copy(target.position);
    } else {
      this.object.position.copy(target.object.position);
    }
  }

  /**
   * Lookas at a specified space in the world
   * @param {Vector3 | Object3D | GameObject} target
   */
  lookAt(target: Vector3 | Object3D | GameObject): void {
    if (target instanceof THREE.Vector3) {
      this.object.lookAt(target);
    } else if (target instanceof THREE.Object3D) {
      this.object.lookAt(target.position);
    } else {
      this.object.lookAt(target.object.position);
    }
  }
}
