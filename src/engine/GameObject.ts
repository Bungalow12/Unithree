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
  moveTo(target: Vector3 | Object3D | GameObject): Promise<Vector3> {
    const targetPosition: THREE.Vector3 = GameObject.extractPosition(target);

    this.object.position.copy(targetPosition);

    return new Promise<Vector3>((resolve) => {
      resolve(targetPosition);
    });
  }

  /**
   * Look at a specified space in the world
   * @param {Vector3 | Object3D | GameObject} target
   */
  lookAt(target: Vector3 | Object3D | GameObject): Promise<Vector3> {
    const targetPosition: THREE.Vector3 = GameObject.extractPosition(target);

    this.object.lookAt(targetPosition);

    return new Promise<Vector3>((resolve) => {
      resolve(targetPosition);
    });
  }

  protected static extractPosition = (target: Vector3 | Object3D | GameObject): Vector3 => {
    const targetPosition: THREE.Vector3 = new THREE.Vector3();
    if (target instanceof THREE.Vector3) {
      targetPosition.copy(target);
    } else if (target instanceof THREE.Object3D) {
      targetPosition.copy(target.position);
    } else {
      targetPosition.copy(target.object.position);
    }
    return targetPosition;
  };
}
