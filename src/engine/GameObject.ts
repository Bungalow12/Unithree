import * as THREE from 'three';

/**
 * Main GameObject class. Think MonoBehaviour
 */
export class GameObject extends THREE.Object3D {
  constructor() {
    super();

    this.update = this.update.bind(this);
  }

  /**
    * Updates is called once per frame
    * @param delta the time since the last update
    */
  update(delta: number) {
    // Do nothing by default
  }
}
