import * as THREE from 'three';

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

export const initializeInput = (domElement: HTMLCanvasElement) => {
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('keydown', onKeyDown);
  domElement.addEventListener('keyup', onKeyUp);
  domElement.addEventListener('wheel', onWheel);
};

let previousPointerCoordinates: THREE.Vector2 | null = null;
let _pointerCoordinates: THREE.Vector2 = new THREE.Vector2();
let _mouseScrollDeltaMode = 0;

const keyStates = new Map<string, ButtonState>();
const pointerButtonStates = new Map<PointerButton, ButtonState>();
const _mouseScrollDelta = new THREE.Vector2();

/**
 * Gets the value of the axis between -1 and 1.
 * If Mouse/Pointer requested you will receive the delta between the last 2 inputs
 * @param {string} axisName the name associated with the axis
 * @returns {number} -1 <= 0 <= 1 or the delta for pointer coordinates
 */
const getAxis = (axisName: string): number => {
  // TODO: Need to find a better way
  const previousPosition = previousPointerCoordinates ? previousPointerCoordinates : _pointerCoordinates;
  if (axisName === 'MouseX') {
    return previousPosition.x - _pointerCoordinates.x;
  }

  if (axisName === 'MouseY') {
    return previousPosition.y - _pointerCoordinates.y;
  }
  return 0;
};

/**
 * Returns true while the user holds down the key identified by name.
 * @param {string} keyName
 * @returns {boolean} True if pressed or held
 */
const getKey = (keyName: string): boolean => {
  return keyStates.has(keyName) && keyStates.get(keyName) !== ButtonState.Released;
};

/**
 * Returns true during the frame the user starts pressing down the key identified by name.
 * @param {string} keyName
 * @returns {boolean} True if pressed this frame
 */
const getKeyDown = (keyName: string): boolean => {
  return keyStates.has(keyName) && keyStates.get(keyName) === ButtonState.Pressed;
};

/**
 * Returns true during the frame the user releases the key identified by name.
 * @param {string} keyName
 * @returns {boolean} True if released this frame
 */
const getKeyUp = (keyName: string): boolean => {
  return keyStates.has(keyName) && keyStates.get(keyName) === ButtonState.Released;
};

/**
 * Returns whether the given pointer button is held down.
 * @param {PointerButton} button
 * @returns {boolean} True if pressed or held
 */
const getPointerButton = (button: PointerButton): boolean => {
  return pointerButtonStates.has(button) && pointerButtonStates.get(button) !== ButtonState.Released;
};

/**
 * Returns true during the frame the user pressed the given pointer button.
 * @param {PointerButton} button
 * @returns {boolean} True if pressed this frame
 */
const getPointerButtonDown = (button: PointerButton): boolean => {
  return pointerButtonStates.has(button) && pointerButtonStates.get(button) === ButtonState.Pressed;
};

/**
 * Returns true during the frame the user releases the given pointer button.
 * @param {PointerButton} button
 * @returns {boolean} True if released this frame
 */
const getPointerButtonUp = (button: PointerButton): boolean => {
  return pointerButtonStates.has(button) && pointerButtonStates.get(button) === ButtonState.Released;
};

const onPointerMove = (event: PointerEvent): void => {
  const pointerPosition = new THREE.Vector2(event.pageX, event.pageY);

  if (!previousPointerCoordinates) {
    previousPointerCoordinates = pointerPosition.clone();
  } else {
    previousPointerCoordinates = _pointerCoordinates.clone();
  }

  _pointerCoordinates = pointerPosition.clone();
};

const onPointerDown = (event: PointerEvent): void => {
  pointerButtonStates.set(event.button, ButtonState.Pressed);
};

const onPointerUp = (event: PointerEvent): void => {
  pointerButtonStates.set(event.button, ButtonState.Released);
};

const onKeyDown = (event: KeyboardEvent): void => {
  keyStates.set(event.key, ButtonState.Pressed);
};

const onKeyUp = (event: KeyboardEvent): void => {
  keyStates.set(event.key, ButtonState.Released);
};

const onWheel = (event: WheelEvent): void => {
  event.preventDefault();

  _mouseScrollDelta.set(event.deltaX, event.deltaY);
  _mouseScrollDeltaMode = event.deltaMode;
};

export const updateInput = (deltaTime: number) => {
  keyStates.forEach((value, key) => {
    if (value === ButtonState.Pressed) {
      keyStates.set(key, ButtonState.Held);
    } else if (value === ButtonState.Released) {
      keyStates.delete(key);
    }
  });

  pointerButtonStates.forEach((value, key) => {
    if (value === ButtonState.Pressed) {
      pointerButtonStates.set(key, ButtonState.Held);
    } else if (value === ButtonState.Released) {
      pointerButtonStates.delete(key);
    }
  });

  _mouseScrollDelta.set(0, 0);
};

export const Input = {
  /**
   * Gets the pointer coordinates in reference to the window
   * @returns {THREE.Vector2} the 2D coordinates of the mouse
   */
  get pointerCoordinates(): THREE.Vector2 {
    return _pointerCoordinates.clone();
  },

  /**
   * Gets the mouse scroll delta since last frame
   * @returns {THREE.Vector2} the 2D delta of the mouse scroll that frame
   */
  get mouseScrollDelta(): THREE.Vector2 {
    return _mouseScrollDelta.clone();
  },

  /**
   * The mouse scroll mode
   * @returns {number} the mode number of the scroll mode
   */
  get mouseScrollDeltaMode(): number {
    return _mouseScrollDeltaMode;
  },
  getAxis,
  getKey,
  getKeyDown,
  getKeyUp,
  getPointerButton,
  getPointerButtonDown,
  getPointerButtonUp,
};
