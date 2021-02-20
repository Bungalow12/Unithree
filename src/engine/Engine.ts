import * as THREE from 'three';

import { GameObject } from './GameObject';

export class Engine {
  private _instance: Engine | null = null;

  private clock: THREE.Clock = new THREE.Clock();
  private scene: THREE.Scene = new THREE.Scene();
  private gameObjects: Array<GameObject> = new Array<GameObject>();

  /**
   * Gets Instance of the GameEngine Singleton
   */
  get instance() {
    if (!this._instance) {
      this._instance = new Engine();
    }
    return this._instance;
  }

  
  add(object: THREE.Object3D) {
    if (object instanceof GameObject) {
      this.gameObjects.push(object as GameObject);
    }
    this.scene.add(object);
  }

  add(objects: THREE.Object3D[]) {
    objects.forEach((object) => {
      this.add(object);
    });
  }

  private constructor() {
    this.add = this.add.bind(this);
  }

  private render = (delta: number) => {

  }

  private update = (delta: number) => {

  }

  private gameLoop = () => {
    const delta = this.clock.getDelta();

    requestAnimationFrame(this.gameLoop);

    this.update(delta);
    this.render(delta);
  };
}
