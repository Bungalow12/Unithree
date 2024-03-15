import { Vector2 } from 'three';
import ProcessorPlugin, { ExecutionType } from '../core/ProcessorPlugin';

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
  Mouse = 'mouse',
  Pen = 'pen',
  Touch = 'touch',
}

const convertStringToInputType = (str: string): InputType | null => {
  switch (str) {
    case 'mouse':
      return InputType.Mouse;
    case 'pen':
      return InputType.Pen;
    case 'touch':
      return InputType.Touch;
  }
  return null;
};

/**
 * Represents the state of a pointer
 */
export class PointerState {
  private id: number;
  private pointerCoordinates: Vector2 = new Vector2();
  private pointerDelta = new Vector2();
  private _pointerButtonStates = new Map<PointerButton, ButtonState>();

  public readonly type: InputType;
  public isPrimary = false;

  constructor(id: number, type: InputType) {
    this.type = type;
    this.id = id;
  }

  public get coordinates(): Vector2 {
    return this.pointerCoordinates;
  }

  public get delta(): Vector2 {
    return this.pointerDelta;
  }

  public get pointerButtonStates(): Map<PointerButton, ButtonState> {
    return this._pointerButtonStates;
  }

  public getButtonState = (button: PointerButton): ButtonState | null => {
    const state = this._pointerButtonStates.get(button);
    return state ?? null;
  };

  public setButtonState = (button: PointerButton, state: ButtonState) => {
    this._pointerButtonStates.set(button, state);
  };

  /**
   * Returns whether the given mouse button is held down.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed or held
   */
  public getPointerButton = (button: PointerButton): boolean => {
    return this._pointerButtonStates.has(button) && this._pointerButtonStates.get(button) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user pressed the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if pressed this frame
   */
  public getPointerButtonPressed = (button: PointerButton): boolean => {
    return this._pointerButtonStates.has(button) && this._pointerButtonStates.get(button) === ButtonState.Pressed;
  };

  /**
   * Returns true if the given mouse button is being held.
   * @param {PointerButton} button
   * @returns {boolean} True if held
   */
  public getPointerButtonDown = (button: PointerButton): boolean => {
    return (
      this._pointerButtonStates.has(button) &&
      (this._pointerButtonStates.get(button) === ButtonState.Pressed ||
        this._pointerButtonStates.get(button) === ButtonState.Held)
    );
  };

  /**
   * Returns true during the frame the user releases the given mouse button.
   * @param {PointerButton} button
   * @returns {boolean} True if released this frame
   */
  public getPointerButtonUp = (button: PointerButton): boolean => {
    return this._pointerButtonStates.has(button) && this._pointerButtonStates.get(button) === ButtonState.Released;
  };
}

export class PointerStateCollection {
  private touchIds: number[] = [];
  private penIds: number[] = [];
  private mouseId: number[] = [];

  private pointers = new Map<number, PointerState>();

  public set = (id: number, type: InputType, isPrimary: boolean): PointerState => {
    const state = this.pointers.get(id) ?? new PointerState(id, type);
    state.isPrimary = isPrimary;

    this.pointers.set(id, state);

    switch (type) {
      case InputType.Mouse:
        this.mouseId.push(id);
        break;
      case InputType.Pen:
        this.penIds.push(id);
        break;
      case InputType.Touch:
        this.touchIds.push(id);
        break;
    }
    return state;
  };

  public delete = (id: number) => {
    const type = this.pointers.get(id)?.type;
    this.pointers.delete(id);

    let index;
    switch (type) {
      case InputType.Mouse:
        index = this.mouseId.findIndex((value) => value === id);
        this.mouseId.splice(index, index);
        break;
      case InputType.Pen:
        index = this.penIds.findIndex((value) => value === id);
        this.penIds.splice(index, index);
        break;
      case InputType.Touch:
        index = this.touchIds.findIndex((value) => value === id);
        this.touchIds.splice(index, index);
        break;
    }
  };

  public get = (id: number): PointerState | null => {
    return this.pointers.get(id) ?? null;
  };

  public getAll = (): PointerState[] => {
    return Array.from(this.pointers.values());
  };

  public getNumberOf = (type: InputType) => {
    switch (type) {
      case InputType.Mouse:
        return this.mouseId.length;
      case InputType.Pen:
        return this.penIds.length;
      case InputType.Touch:
        return this.touchIds.length;
    }
  };

  public getAllOf = (type: InputType) => {
    const states: PointerState[] = [];

    switch (type) {
      case InputType.Mouse:
        this.mouseId.forEach((id) => {
          if (this.pointers.has(id)) {
            states.push(this.pointers.get(id)!);
          }
        });
        break;
      case InputType.Pen:
        this.penIds.forEach((id) => {
          if (this.pointers.has(id)) {
            states.push(this.pointers.get(id)!);
          }
        });
        break;
      case InputType.Touch:
        this.touchIds.forEach((id) => {
          if (this.pointers.has(id)) {
            states.push(this.pointers.get(id)!);
          }
        });
        break;
    }

    return states;
  };

  public getPrimaryOf = (type: InputType) => {
    for (const pointer of this.pointers.values()) {
      if (pointer.isPrimary && pointer.type === type) {
        return pointer;
      }
    }
  };

  public clearAllDeltas = () => {
    this.pointers.forEach((pointer) => pointer.delta.set(0, 0));
  };
}

/**
 * Class that processes user plugin and allows for easy reading of the states and values
 */
class Input extends ProcessorPlugin {
  private reusableVector = new Vector2();

  protected domElement: HTMLCanvasElement;
  protected pointerStates: PointerStateCollection = new PointerStateCollection();

  // protected pointerCoordinates: Vector2 = new Vector2();
  // protected framePointerDelta = new Vector2();
  // protected pointerDelta = new Vector2();

  protected keyStates = new Map<string, ButtonState>();
  // protected pointerButtonStates = new Map<PointerButton, ButtonState>();

  protected mouseScrollDelta = new Vector2();
  protected _mouseScrollDeltaMode = 0;

  constructor(domElement: HTMLCanvasElement) {
    super(ExecutionType.Always);
    this.domElement = domElement;
    this.initialize = this.initialize.bind(this);
    this.update = this.update.bind(this);
  }

  /**
   * Gets the pointer coordinates in reference to the window
   * @param {InputType} type the input type
   * @param {Vector2} out optional out vector
   * @returns {Vector2 | null} the vector or null if the input is not active.
   */
  public getPointerCoordinates = (type: InputType, out?: Vector2): Vector2 | null => {
    const state = this.pointerStates.getPrimaryOf(type);
    if (state) {
      return out ? out.set(...state.coordinates.toArray()) : state.coordinates.clone();
    }
    return null;
  };

  /**
   * Gets the delta between the pointer position this frame and previous frame.
   * @param type the input type
   * @param {Vector2} out optional out vector
   * @returns {Vector2} Vector2 where the values are the delta for pointer coordinates for that axis
   */
  public getPointerDelta = (type: InputType, out?: Vector2): Vector2 => {
    const state = this.pointerStates.getPrimaryOf(type);
    if (state) {
      return out ? out.set(...state.delta.toArray()) : state.delta.clone();
    }
    return out ? out.set(0, 0) : new Vector2();

    // const previousPosition = this.previousPointerCoordinates
    //   ? this.previousPointerCoordinates
    //   : this._pointerCoordinates;
    // out.set(previousPosition.x - this._pointerCoordinates.x, previousPosition.y - this._pointerCoordinates.y);

    // return out;
  };

  /**
   * Get all Pointer States
   * @param {InputType} type optional input type filter
   * @returns {PointerState[]} list of all matching pointer states
   */
  public getPointerStates = (type?: InputType): PointerState[] => {
    if (type) {
      return this.pointerStates.getAllOf(type);
    }
    return this.pointerStates.getAll();
  };

  /**
   * Gets the number of active touches
   * @returns {number} number of touches
   */
  public get touchCount(): number {
    return this.pointerStates.getNumberOf(InputType.Touch);
  }

  /**
   * Gets the mouse scroll delta since last frame
   * @returns {Vector2}
   */
  public getMouseScrollDelta(out?: Vector2): Vector2 {
    return out ? out.set(...this.mouseScrollDelta.toArray()) : this.mouseScrollDelta.clone();
  }

  public get mouseScrollDeltaMode(): number {
    return this._mouseScrollDeltaMode;
  }

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
  public getKeyPressed = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Pressed;
  };

  /**
   * Returns true if the key identified by name is being held.
   * @param {string} keyName
   * @returns {boolean} True if held
   */
  public getKeyDown = (keyName: string): boolean => {
    return (
      this.keyStates.has(keyName) &&
      (this.keyStates.get(keyName) === ButtonState.Pressed || this.keyStates.get(keyName) === ButtonState.Held)
    );
  };

  /**
   * Returns true during the frame the user releases the key identified by name.
   * @param {string} keyName
   * @returns {boolean} True if released this frame
   */
  public getKeyUp = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Released;
  };

  public initialize(domElement?: HTMLCanvasElement): void {
    this.domElement = domElement ?? this.domElement;

    this.domElement.style.touchAction = 'none';
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointercancel', this.onPointerCancel);
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.domElement.addEventListener('keydown', this.onKeyDown);
    this.domElement.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('wheel', this.onWheel);

    this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp);
    this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove);
  }

  public dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('keydown', this.onKeyDown);
    this.domElement.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
  }

  public update(): void {
    this.keyStates.forEach((value, key) => {
      if (value === ButtonState.Pressed) {
        this.keyStates.set(key, ButtonState.Held);
      } else if (value === ButtonState.Released) {
        this.keyStates.delete(key);
      }
    });

    this.pointerStates.getAll().forEach((state) => {
      state.pointerButtonStates.forEach((value, key) => {
        if (value === ButtonState.Pressed) {
          state.pointerButtonStates.set(key, ButtonState.Held);
        } else if (value === ButtonState.Released) {
          state.pointerButtonStates.delete(key);
        }
      });
    });

    this.mouseScrollDelta.set(0, 0);
  }

  public lateUpdate(): void {
    this.pointerStates.clearAllDeltas();
  }

  private onContextMenu = (event: Event) => {
    if (!this.enabled) return;
    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent): void => {
    // const pointerPosition = new Vector2(event.pageX, event.pageY);

    // if (!this.previousPointerCoordinates) {
    //   this.previousPointerCoordinates = pointerPosition.clone();
    // } else {
    //   this.previousPointerCoordinates = this._pointerCoordinates.clone();
    // }
    //
    const type = convertStringToInputType(event.type);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);

      state.coordinates.set(event.pageX, event.pageY);
      const buttonState = state.pointerButtonStates.get(event.button);
      if (buttonState && buttonState !== ButtonState.Released) {
        this.reusableVector.set(event.pageX, event.pageY);
        state.delta.add(this.reusableVector);
      }
    }
  };

  private onPointerDown = (event: PointerEvent): void => {
    const type = convertStringToInputType(event.type);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
      state.pointerButtonStates.set(event.button, ButtonState.Pressed);
    }
  };

  private onPointerCancel = (event: PointerEvent): void => {
    const type = convertStringToInputType(event.type);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
      state.pointerButtonStates.delete(event.button);
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    const type = convertStringToInputType(event.type);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
      state.pointerButtonStates.set(event.button, ButtonState.Released);
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Pressed);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Released);
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();

    this.mouseScrollDelta.set(event.deltaX, event.deltaY);
    this._mouseScrollDeltaMode = event.deltaMode;
  };
}

export default Input;
