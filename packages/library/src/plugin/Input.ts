import * as THREE from 'three';
import { ExecutionType, UnithreePlugin } from '../core';

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

export enum InputType {
  Mouse,
}

/**
 * Class that processes user plugin and allows for easy reading of the states and values
 */
export class Input implements UnithreePlugin {
  protected previousPointerCoordinates: THREE.Vector2 | null = null;
  protected _pointerCoordinates: THREE.Vector2 = new THREE.Vector2();

  protected keyStates = new Map<string, ButtonState>();
  protected pointerButtonStates = new Map<PointerButton, ButtonState>();

  protected _mouseScrollDelta = new THREE.Vector2();
  protected _mouseScrollDeltaMode = 0;

  public executionType = ExecutionType.Always;

  constructor(domElement: HTMLCanvasElement) {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);

    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('keydown', this.onKeyDown);
    domElement.addEventListener('keyup', this.onKeyUp);
    domElement.addEventListener('wheel', this.onWheel);
  }

  /**
   * Gets the pointer coordinates in reference to the window
   * @returns {THREE.Vector2}
   */
  public get pointerCoordinates(): THREE.Vector2 {
    return this._pointerCoordinates.clone();
  }

  /**
   * Gets the mouse scroll delta since last frame
   * @returns {THREE.Vector2}
   */
  public get mouseScrollDelta(): THREE.Vector2 {
    return this._mouseScrollDelta.clone();
  }

  public get mouseScrollDeltaMode(): number {
    return this._mouseScrollDeltaMode;
  }

  /**
   * Gets the delta between the pointer position this frame and previous frame.
   * @param {THREE.Vector2} out optional out vector
   * @returns {THREE.Vector2} Vector2 where the values are the delta for pointer coordinates for that axis
   */
  public getPointerDelta = (out?: THREE.Vector2): THREE.Vector2 => {
    out = out ?? new THREE.Vector2();

    const previousPosition = this.previousPointerCoordinates
      ? this.previousPointerCoordinates
      : this._pointerCoordinates;
    out.set(previousPosition.x - this.pointerCoordinates.x, previousPosition.y - this.pointerCoordinates.y);

    return out;
  };

  /**
   * Returns true while the user holds down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed or held
   */
  public getKey = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user starts pressing down the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if pressed this frame
   */
  public getKeyDown = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Pressed;
  };

  /**
   * Returns true during the frame the user releases the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if released this frame
   */
  public getKeyUp = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Released;
  };

  /**
   * Returns whether the given mouse button is held down.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed or held
   */
  public getMouseButton = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user pressed the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed this frame
   */
  public getMouseButtonDown = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) === ButtonState.Pressed;
  };

  /**
   * Returns true during the frame the user releases the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if released this frame
   */
  public getMouseButtonUp = (button: PointerButton): boolean => {
    return this.pointerButtonStates.has(button) && this.pointerButtonStates.get(button) === ButtonState.Released;
  };

  public run = (): void => {
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
