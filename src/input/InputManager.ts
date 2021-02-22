import * as THREE from "three";
import { Vector2 } from "../engine/Types";
import { Engine } from "../engine";

/**
 * The state of the button
 */
export enum ButtonState {
  Pressed,
  Held,
  Released,
}

/**
 * The Pointer/Mouse Button definition
 */
export enum PointerButton {
  Primary,
  Auxiliary,
  Secondary,
}

/**
 * Class that processes user input and allows for easy reading of the states and values
 */
export class Input {
  private static _instance: Input | null = null;

  private pointerCoordinates: Vector2 = new THREE.Vector2();

  private keyStates = new Map<string, ButtonState>();
  private pointerButtonStates = new Map<PointerButton, ButtonState>();

  /**
   * Gets Instance of the InputManager
   */
  static get instance(): Input {
    if (!this._instance) {
      this._instance = new Input();
    }
    return this._instance;
  }

  /**
   * Returns true while the user holds down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed or held
   */
  getKey = (keyName: string): boolean => {
    return (
      this.keyStates.has(keyName) &&
      this.keyStates.get(keyName) !== ButtonState.Released
    );
  };

  /**
   * Returns true during the frame the user starts pressing down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed this frame
   */
  getKeyDown = (keyName: string): boolean => {
    return (
      this.keyStates.has(keyName) &&
      this.keyStates.get(keyName) === ButtonState.Pressed
    );
  };

  /**
   * Returns true during the frame the user releases the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if released this frame
   */
  getKeyUp = (keyName: string): boolean => {
    return (
      this.keyStates.has(keyName) &&
      this.keyStates.get(keyName) === ButtonState.Released
    );
  };

  /**
   * Returns whether the given mouse button is held down.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed or held
   */
  getMouseButton = (button: PointerButton): boolean => {
    return (
      this.pointerButtonStates.has(button) &&
      this.pointerButtonStates.get(button) !== ButtonState.Released
    );
  };

  /**
   * Returns true during the frame the user pressed the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed this frame
   */
  getMouseButtonDown = (button: PointerButton): boolean => {
    return (
      this.pointerButtonStates.has(button) &&
      this.pointerButtonStates.get(button) === ButtonState.Pressed
    );
  };

  /**
   * Returns true during the frame the user releases the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if released this frame
   */
  getMouseButtonUp = (button: PointerButton): boolean => {
    return (
      this.pointerButtonStates.has(button) &&
      this.pointerButtonStates.get(button) === ButtonState.Released
    );
  };

  update = (delta: number): void => {
    this.keyStates.forEach((value, key) => {
      if (value === ButtonState.Pressed) {
        this.keyStates.set(key, ButtonState.Held);
      } else if (value === ButtonState.Released) {
        this.keyStates.delete(key);
      }
    });

    this.pointerButtonStates.forEach((value, key) => {
      if (value === ButtonState.Pressed) {
        this.pointerButtonStates.set(key, ButtonState.Held);
      } else if (value === ButtonState.Released) {
        this.pointerButtonStates.delete(key);
      }
    });
  };

  private constructor() {
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointerup", this.onPointerUp);

    const domElement = Engine.instance.domElement;
    domElement.addEventListener("keydown", this.onKeyDown);
    domElement.addEventListener("keyup", this.onKeyUp);
  }

  private onPointerMove = (event: PointerEvent): void => {
    const domElement = Engine.instance.domElement;
    const viewHalfSize = Engine.instance.viewHalfSize;
    this.pointerCoordinates = new THREE.Vector2(
      event.pageX - domElement.offsetLeft - viewHalfSize.x,
      event.pageY - domElement.offsetTop - viewHalfSize.y
    );
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.pointerButtonStates.set(event.button, ButtonState.Pressed);
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.pointerButtonStates.set(event.button, ButtonState.Released);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Pressed);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Released);
  };
}
