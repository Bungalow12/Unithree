import * as THREE from 'three';

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class GameObject<T extends THREE.Object3D = THREE.Object3D> {
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
   * @param {THREE.Vector3 | THREE.Object3D | GameObject} target
   */
  moveTo(target: THREE.Vector3 | THREE.Object3D | GameObject): Promise<THREE.Vector3> {
    const targetPosition: THREE.Vector3 = GameObject.extractPosition(target);

    this.object.position.copy(targetPosition);

    return new Promise<THREE.Vector3>((resolve) => {
      resolve(targetPosition);
    });
  }

  /**
   * Look at a specified space in the world
   * @param {THREE.Vector3 | THREE.Object3D | GameObject} target
   */
  lookAt(target: THREE.Vector3 | THREE.Object3D | GameObject): Promise<THREE.Vector3> {
    const targetPosition: THREE.Vector3 = GameObject.extractPosition(target);

    this.object.lookAt(targetPosition);

    return new Promise<THREE.Vector3>((resolve) => {
      resolve(targetPosition);
    });
  }

  /**
   * Makes a game object a child of another object.
   * @param gameObject
   */
  addChild = (gameObject: GameObject): void => {
    this._object.add(gameObject.object);
  };

  protected static extractPosition = (target: THREE.Vector3 | THREE.Object3D | GameObject): THREE.Vector3 => {
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
