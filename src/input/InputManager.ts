import * as THREE from 'three';
import { Engine } from '../engine';

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

  private previousPointerCoordinates: THREE.Vector2 | null = null;
  private _pointerCoordinates: THREE.Vector2 = new THREE.Vector2();

  private keyStates = new Map<string, ButtonState>();
  private pointerButtonStates = new Map<PointerButton, ButtonState>();

  private _mouseScrollDelta = new THREE.Vector2();
  private _mouseScrollDeltaMode = 0;

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
   * Gets the pointer coordinates in reference to the window
   * @returns {THREE.Vector2}
   */
  get pointerCoordinates(): THREE.Vector2 {
    return this._pointerCoordinates.clone();
  }

  /**
   * Gets the pointer coordinates in reference to the renderer element.
   * @returns {THREE.Vector2}
   */
  get pointerClientCoordinates(): THREE.Vector2 {
    const rect = Engine.instance.rendererRect;
    const halfSize = Engine.instance.viewHalfSize;
    return new THREE.Vector2(
      this._pointerCoordinates.x - rect.x - halfSize.x,
      this._pointerCoordinates.y - rect.y - halfSize.y,
    );
  }

  /**
   * Gets the mouse scroll delta since last frame
   * @returns {THREE.Vector2}
   */
  get mouseScrollDelta(): THREE.Vector2 {
    return this._mouseScrollDelta.clone();
  }

  get mouseScrollDeltaMode(): number {
    return this._mouseScrollDeltaMode;
  }

  /**
   * Gets the value of the axis between -1 and 1.
   * If Mouse/Pointer requested you will receive the delta between the last 2 inputs
   * @param {string} axisName the name associated with the axis
   * @returns {number} -1 <= 0 <= 1 or the delta for pointer coordinates
   */
  getAxis = (axisName: string): number => {
    // TODO: Handle a system for this. Temporarily add MouseX and MouseY
    const previousPosition = this.previousPointerCoordinates
      ? this.previousPointerCoordinates
      : this._pointerCoordinates;
    if (axisName === 'MouseX') {
      return previousPosition.x - this.pointerCoordinates.x;
    }

    if (axisName === 'MouseY') {
      return previousPosition.y - this.pointerCoordinates.y;
    }
    return 0;
  };

  /**
   * Returns true while the user holds down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed or held
   */
  getKey = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user starts pressing down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed this frame
   */
  getKeyDown = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Pressed;
  };

  /**
   * Returns true during the frame the user releases the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if released this frame
   */
  getKeyUp = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Released;
  };

  /**
   * Returns whether the given mouse button is held down.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed or held
   */
  getMouseButton = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user pressed the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed this frame
   */
  getMouseButtonDown = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) === ButtonState.Pressed;
  };

  /**
   * Returns true during the frame the user releases the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if released this frame
   */
  getMouseButtonUp = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) === ButtonState.Released;
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

    this._mouseScrollDelta.set(0, 0);
  };

  private constructor() {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

    const domElement = Engine.instance.domElement;
    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('keydown', this.onKeyDown);
    domElement.addEventListener('keyup', this.onKeyUp);
    domElement.addEventListener('wheel', this.onWheel);
  }

  private onPointerMove = (event: PointerEvent): void => {
    const pointerPosition = new THREE.Vector2(event.pageX, event.pageY);

    if (!this.previousPointerCoordinates) {
      this.previousPointerCoordinates = pointerPosition.clone();
    } else {
      this.previousPointerCoordinates = this._pointerCoordinates.clone();
    }

    this._pointerCoordinates = pointerPosition.clone();
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

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();

    this._mouseScrollDelta.set(event.deltaX, event.deltaY);
    this._mouseScrollDeltaMode = event.deltaMode;
  };
}
