import * as THREE from "three";
import { Vector2 } from "../engine/Types";

export class InputManager {
  private static _instance: InputManager | null = null;

  private _pointerCoordinates: Vector2 = new THREE.Vector2();

  private constructor() {}

  /**
   * Gets Instance of the InputManager
   */
  static get instance(): InputManager {
    if (!this._instance) {
      this._instance = new InputManager();
    }
    return this._instance;
  }

  get pointerCoordinates(): Vector2 {
    return this._pointerCoordinates;
  }

  set pointerCoordinates(coordinates: Vector2) {
    this._pointerCoordinates = coordinates;
  }
}
