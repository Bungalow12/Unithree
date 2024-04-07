import { Vector2 } from 'three';
import ProcessorPlugin from '../ProcessorPlugin';

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
 * The type of pointer input device
 */
export enum InputType {
  Mouse = 'mouse',
  Pen = 'pen',
  Touch = 'touch',
}

/**
 * Gamepad Thumb Sticks
 */
export enum ThumbStick {
  Left = 0,
  Right = 2,
}

/**
 * Playstation standard button mapping based on https://w3c.github.io/gamepad/#remapping
 */
export enum PlaystationButtonMapping {
  Cross,
  Circle,
  Square,
  Triangle,
  L1,
  R1,
  L2,
  R2,
  Select,
  Start,
  L3,
  R3,
  Up,
  Down,
  Left,
  Right,
  PSButton,
}

/**
 * XBox standard button mapping based on https://w3c.github.io/gamepad/#remapping
 */
export enum XBoxButtonMapping {
  A,
  B,
  X,
  Y,
  LB,
  RB,
  LT,
  RT,
  Back,
  Play,
  LeftStick,
  RightStick,
  Up,
  Down,
  Left,
  Right,
  Home,
}

/**
 * Nintendo Switch standard button mapping based on https://w3c.github.io/gamepad/#remapping
 */
export enum SwitchButtonMapping {
  B,
  A,
  Y,
  X,
  L,
  R,
  ZL,
  ZR,
  Minus,
  Plus,
  LeftStick,
  RightStick,
  Up,
  Down,
  Left,
  Right,
  Home,
}

/**
 * Represents the state of a pointer
 */
export class PointerState {
  private id: number;
  private pointerCoordinates: Vector2 = new Vector2();
  private pointerDelta = new Vector2();
  private _buttonStates = new Map<PointerButton, ButtonState>();

  /**
   * The type of the pointer
   * @type {InputType} Mouse, Pen or Touch
   */
  public readonly type: InputType;

  /**
   * If the pointer is considered primary
   * @type {boolean} True if the pointer is considered primary
   */
  public isPrimary = false;

  constructor(id: number, type: InputType) {
    this.type = type;
    this.id = id;
  }

  /**
   * Gets the most recent coordinates of the pointer
   * @returns {Vector2} Pointer coordinates in reference to the Page
   */
  public get coordinates(): Vector2 {
    return this.pointerCoordinates;
  }

  /**
   * Gets the delta since last update
   * @returns {Vector2} Pointer delta in reference to the Page
   */
  public get delta(): Vector2 {
    return this.pointerDelta;
  }

  /**
   * Gets the map of button states
   * @returns {Map<PointerButton, ButtonState>} Map of button types to button states
   */
  public get buttonStates(): Map<PointerButton, ButtonState> {
    return this._buttonStates;
  }

  /**
   * Gets the state of a specific button
   * @param {PointerButton} button the pointer button
   * @returns {ButtonState | null} the state or null if not recently used
   */
  public getButtonState = (button: PointerButton): ButtonState | null => {
    const state = this._buttonStates.get(button);
    return state ?? null;
  };

  /**
   * Sets the state for a specific button
   * @param {PointerButton} button the pointer button
   * @param {ButtonState} state the state of the button
   */
  public setButtonState = (button: PointerButton, state: ButtonState): void => {
    this._buttonStates.set(button, state);
  };

  /**
   * Returns whether the given pointer button is held down but has not just been pressed this frame.
   * @param {PointerButton} button the pointer button
   * @returns {boolean} True if held
   */
  public getButtonHeld = (button: PointerButton): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user pressed the given pointer button.
   * @param {PointerButton} button the pointer button
   * @returns {boolean} True if pressed this frame
   */
  public getButtonPressed = (button: PointerButton): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) === ButtonState.Pressed;
  };

  /**
   * Returns true if the given pointer button has been pressed or is being held.
   * @param {PointerButton} button the pointer button
   * @returns {boolean} True if pressed or held
   */
  public getButtonDown = (button: PointerButton): boolean => {
    return (
      this._buttonStates.has(button) &&
      (this._buttonStates.get(button) === ButtonState.Pressed || this._buttonStates.get(button) === ButtonState.Held)
    );
  };

  /**
   * Returns true during the frame the user releases the given pointer button.
   * @param {PointerButton} button the pointer button
   * @returns {boolean} True if released this frame
   */
  public getButtonUp = (button: PointerButton): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) === ButtonState.Released;
  };
}

/**
 * Class maintaining a collection of pointer states
 */
export class PointerStateCollection {
  private touchIds: Set<number> = new Set<number>();
  private penIds: Set<number> = new Set<number>();
  private mouseIds: Set<number> = new Set<number>();

  private pointers = new Map<number, PointerState>();

  /**
   * Sets a pointer state
   * @param {number} id event.pointerId
   * @param {InputType} type event.pointerType
   * @param {boolean} isPrimary event.isPrimary
   * @returns {PointerState} the state that was set
   */
  public set = (id: number, type: InputType, isPrimary: boolean): PointerState => {
    const state = this.pointers.get(id) ?? new PointerState(id, type);
    state.isPrimary = isPrimary;

    this.pointers.set(id, state);

    switch (type) {
      case InputType.Mouse:
        this.mouseIds.add(id);
        break;
      case InputType.Pen:
        this.penIds.add(id);
        break;
      case InputType.Touch:
        this.touchIds.add(id);
        break;
    }
    return state;
  };

  /**
   * Deletes a previously set pointer
   * @param {number} id event.pointerId
   */
  public delete = (id: number): void => {
    const type = this.pointers.get(id)?.type;
    this.pointers.delete(id);

    switch (type) {
      case InputType.Mouse:
        this.mouseIds.delete(id);
        break;
      case InputType.Pen:
        this.penIds.delete(id);
        break;
      case InputType.Touch:
        this.touchIds.delete(id);
        break;
    }
  };

  /**
   * Gets a pointer state
   * @param {number} id event.pointerId
   * @returns {PointerState | null} the pointer state or null if it does not exist
   */
  public get = (id: number): PointerState | null => {
    return this.pointers.get(id) ?? null;
  };

  /**
   * Gets all pointer states
   * @returns {PointerState[]}
   */
  public getAll = (): PointerState[] => {
    return Array.from(this.pointers.values());
  };

  /**
   * Gets the number of pointers of a specified type
   * @param {InputType} type the pointer input type
   * @returns {number} the number of present pointers of that type
   */
  public getNumberOf = (type: InputType): number => {
    switch (type) {
      case InputType.Mouse:
        return this.mouseIds.size;
      case InputType.Pen:
        return this.penIds.size;
      case InputType.Touch:
        return this.touchIds.size;
    }
  };

  /**
   * Gets all pointer states of a specified input
   * @param {InputType} type the type of the input
   * @returns {PointerState[]} a list of all matching pointer states
   */
  public getAllOf = (type: InputType): PointerState[] => {
    const states: PointerState[] = [];

    switch (type) {
      case InputType.Mouse:
        this.mouseIds.forEach((id) => {
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

  /**
   * Gets only the primary pointer state for the specified type
   * @param {InputType} type the pointer input type
   * @returns {PointerState | null} the primary pointer state or null if it does not exist
   */
  public getPrimaryOf = (type: InputType): PointerState | null => {
    for (const pointer of this.pointers.values()) {
      if (pointer.isPrimary && pointer.type === type) {
        return pointer;
      }
    }

    return null;
  };

  /**
   * Clears all the deltas per pointer
   */
  public clearAllDeltas = (): void => {
    this.pointers.forEach((pointer) => pointer.delta.set(0, 0));
  };
}

/**
 * Represents the state of a gamepad
 */
export class GamepadState {
  private id: string;
  private _buttonStates = new Map<number, ButtonState>();

  public playerIndex: number;

  public lastUpdated = 0;

  constructor(id: string, playerIndex = 0) {
    this.id = id;
    this.playerIndex = playerIndex;
  }

  /**
   * the total number of Axes available for this gamepad
   * @returns {number} the number of available axes
   */
  public get totalAxes(): number {
    return navigator.getGamepads()[this.playerIndex]?.axes.length ?? 0;
  }

  /**
   * The total number of buttons available for this gamepad
   * @returns {number} the number of available buttons
   */
  public get totalButtons(): number {
    return navigator.getGamepads()[this.playerIndex]?.buttons.length ?? 0;
  }

  /**
   * Shows whether the attached controller supports a standard mapping
   * @returns {boolean}
   */
  public get hasStandardMapping(): boolean {
    return navigator.getGamepads()[this.playerIndex]?.mapping === 'standard';
  }

  /**
   * Gets the map of button states
   * @returns {Map<number, ButtonState>} Map of button types to button states
   */
  public get buttonStates(): Map<number, ButtonState> {
    return this._buttonStates;
  }

  /**
   * Get an individual axis by index
   * @param {number} index the index of the axis. (NOTE: Even is vertical, Odd is horizontal)
   * @returns {number} The value with a default of 0
   */
  public getAxis = (index: number): number => {
    return navigator.getGamepads()[this.playerIndex]?.axes[index] ?? 0;
  };

  /**
   * Gets the value of the thumb stick X and Y axis (-1.0 - 1.0)
   * @param {ThumbStick} stick stick starting index
   * @param {Vector2} out (Optional) out vector for reuse
   * @returns {Vector2} the Vector2 representing the thumb stick values
   */
  public getThumbStickValue = (stick: ThumbStick, out?: Vector2): Vector2 => {
    const x = navigator.getGamepads()[this.playerIndex]?.axes[stick] ?? 0;
    const y = navigator.getGamepads()[this.playerIndex]?.axes[stick + 1] ?? 0;
    return out ? out.set(x, y) : new Vector2(x, y);
  };

  /**
   * Gets whether a capacitive button is being touched. This will mirror the pressed state if the button is not capacitive
   * @param {number} button the button index
   * @returns {boolean} true if being touched
   */
  public getButtonTouchedState = (button: number): boolean => {
    return navigator.getGamepads()[this.playerIndex]?.buttons[button].touched ?? false;
  };

  /**
   * Gets the value of a specific button
   * @param {number} button the button index
   * @returns {number} value from 0.0 to 1.0
   */
  public getButtonValue = (button: number): number => {
    return navigator.getGamepads()[this.playerIndex]?.buttons[button].value ?? 0;
  };

  /**
   * Gets the state of a specific button
   * @param {number} button the button index
   * @returns {ButtonState | null} the state or null if not recently used
   */
  public getButtonState = (button: number): ButtonState | null => {
    const state = this._buttonStates.get(button);
    return state ?? null;
  };

  /**
   * Sets the state for a specific button
   * @param {number} button the button index
   * @param {ButtonState} state the state of the button
   */
  public setButtonState = (button: number, state: ButtonState): void => {
    this._buttonStates.set(button, state);
  };

  /**
   * Returns whether the given button is held down but has not just been pressed this frame.
   * @param {number} button the button index
   * @returns {boolean} True if held
   */
  public getButtonHeld = (button: number): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user pressed the given button.
   * @param {number} button the button index
   * @returns {boolean} True if pressed this frame
   */
  public getButtonPressed = (button: number): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) === ButtonState.Pressed;
  };

  /**
   * Returns true if the given button has been pressed or is being held.
   * @param {number} button the button index
   * @returns {boolean} True if pressed or held
   */
  public getButtonDown = (button: number): boolean => {
    return (
      this._buttonStates.has(button) &&
      (this._buttonStates.get(button) === ButtonState.Pressed || this._buttonStates.get(button) === ButtonState.Held)
    );
  };

  /**
   * Returns true during the frame the user releases the given button.
   * @param {number} button the button index
   * @returns {boolean} True if released this frame
   */
  public getButtonUp = (button: number): boolean => {
    return this._buttonStates.has(button) && this._buttonStates.get(button) === ButtonState.Released;
  };
}

/**
 * Class maintaining a collection of gamepad states
 */
export class GamepadStateCollection {
  private gamepads = new Map<string, GamepadState>();

  /**
   * Sets a gamepad state
   * @param {string} id event.gamepad.id
   * @param {number} playerIndex event.gamepad.index
   * @param timestamp event.gamepad.timestamp
   * @returns {GamepadState} the state that was set
   */
  public set = (id: string, playerIndex: number, timestamp: number): GamepadState => {
    const state = this.gamepads.get(id) ?? new GamepadState(id);

    if (state.lastUpdated <= timestamp) {
      state.playerIndex = playerIndex;
      state.lastUpdated = timestamp;
      this.gamepads.set(id, state);
    }

    return state;
  };

  /**
   * Deletes a previously set gamepad
   * @param {string} id event.gamepad.id
   */
  public delete = (id: string): void => {
    this.gamepads.delete(id);
  };

  /**
   * Gets a gamepad state
   * @param {string} id event.gamepad.id
   * @returns {GamepadState | null} the gamepad state or null if it does not exist
   */
  public get = (id: string): GamepadState | null => {
    return this.gamepads.get(id) ?? null;
  };

  /**
   * Gets all gamepad states
   * @returns {GamepadState[]}
   */
  public getAll = (): GamepadState[] => {
    return Array.from(this.gamepads.values());
  };
}

/**
 * Class that processes user input and allows for easy reading of the states and values
 */
class Input extends ProcessorPlugin {
  /**
   * Simple Map of string to InputType
   * @type {Map<string, InputType>} the map of string to Input Type
   */
  public static stringToInputMap: Map<string, InputType> = new Map<string, InputType>([
    ['mouse', InputType.Mouse],
    ['pen', InputType.Pen],
    ['touch', InputType.Touch],
  ]);

  private reusableVector = new Vector2();

  protected domElement: HTMLCanvasElement;
  protected pointerStates: PointerStateCollection = new PointerStateCollection();
  protected gamepadStates: GamepadStateCollection = new GamepadStateCollection();
  protected keyStates = new Map<string, ButtonState>();

  protected mouseScrollDelta = new Vector2();
  protected _mouseScrollDeltaMode = 0;

  constructor(domElement: HTMLCanvasElement) {
    super();
    this.domElement = domElement;
    this.updateGamepadStates = this.updateGamepadStates.bind(this);
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
  };

  /**
   * Get primary Pointer State
   * @param {InputType} type input type filter. Default : Mouse
   * @returns {PointerState} Primary pointer state for the input type
   */
  public getPrimaryPointerState = (type: InputType = InputType.Mouse): PointerState | null => {
    return this.pointerStates.getPrimaryOf(type) ?? null;
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
   * @returns {Vector2} the two dimensional scroll wheel delta
   */
  public getMouseScrollDelta = (out?: Vector2): Vector2 =>
    out ? out.set(...this.mouseScrollDelta.toArray()) : this.mouseScrollDelta.clone();

  /**
   * Returns the scroll mode. This is most likely pixel
   * @returns {number} DOM_DELTA_PIXEL = 0, DOM_DELTA_LINE = 1, DOM_DELTA_PAGE = 2
   */
  public get mouseScrollDeltaMode(): number {
    return this._mouseScrollDeltaMode;
  }

  /**
   * Get the gamepad for a specific player
   * @param {number} playerIndex Zero based index of players
   * @returns {GamepadState | null} the gamepad state or null if not found
   */
  public getGamepad = (playerIndex: number): GamepadState | null => {
    const id = navigator.getGamepads()[playerIndex]?.id ?? '';

    return this.gamepadStates.get(id);
  };

  /**
   * Gets all connected gamepad states
   * @returns {GamepadState[]} the gamepad states
   */
  public getGamepads = (): GamepadState[] => {
    return this.gamepadStates.getAll();
  };

  /**
   * Returns true if the key is being held but has not been pressed this frame.
   * @param {string} keyName the key to check (event.keyName)
   * @returns {boolean} True if held
   */
  public getKeyHeld = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) !== ButtonState.Released;
  };

  /**
   * Returns true during the frame the user starts pressing down the key identified by name.
   * @param {string} keyName the key to check (event.keyName)
   * @returns {boolean} True if pressed this frame
   */
  public getKeyPressed = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Pressed;
  };

  /**
   * Returns true if the key identified by name was pressed or is being held.
   * @param {string} keyName the key to check (event.keyName)
   * @returns {boolean} True if pressed or held
   */
  public getKeyDown = (keyName: string): boolean => {
    return (
      this.keyStates.has(keyName) &&
      (this.keyStates.get(keyName) === ButtonState.Pressed || this.keyStates.get(keyName) === ButtonState.Held)
    );
  };

  /**
   * Returns true during the frame the user releases the key identified by name.
   * @param {string} keyName the key to check (event.keyName)
   * @returns {boolean} True if released this frame
   */
  public getKeyUp = (keyName: string): boolean => {
    return this.keyStates.has(keyName) && this.keyStates.get(keyName) === ButtonState.Released;
  };

  /**
   * Initializes the Input plugin
   * @param {HTMLCanvasElement} domElement the main canvas element for ThreeJS
   */
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

    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  /**
   * Cleans up the event listeners for the plugin
   */
  public dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('keydown', this.onKeyDown);
    this.domElement.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);

    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  /**
   * The update method called once per frame
   */
  public update(): void {
    this.updateGamepadStates();

    this.keyStates.forEach((value, key) => {
      if (value === ButtonState.Pressed) {
        this.keyStates.set(key, ButtonState.Held);
      } else if (value === ButtonState.Released) {
        this.keyStates.delete(key);
      }
    });

    this.pointerStates.getAll().forEach((state) => {
      state.buttonStates.forEach((value, key) => {
        if (value === ButtonState.Pressed) {
          state.buttonStates.set(key, ButtonState.Held);
        } else if (value === ButtonState.Released) {
          state.buttonStates.delete(key);
        }
      });
    });
  }

  /**
   * The late update method called after all updates hav occurred
   */
  public lateUpdate(): void {
    this.pointerStates.clearAllDeltas();
    this.mouseScrollDelta.set(0, 0);
  }

  protected updateGamepadStates(): void {
    const connectedGamepads = navigator.getGamepads();

    connectedGamepads.forEach((gamepad) => {
      if (!gamepad || !gamepad.connected) return;

      // Just in case this somehow happens prior to the connected event
      const state = this.gamepadStates.set(gamepad.id, gamepad.index, gamepad.timestamp);

      // If this fails the timestamp is out of order and latest wins
      if (state.lastUpdated !== gamepad.timestamp) return;

      gamepad.buttons.forEach((button, index) => {
        const previousState = state.buttonStates.get(index) ?? null;

        if (previousState === null && button.pressed) {
          state.buttonStates.set(index, ButtonState.Pressed);
        } else if (previousState === ButtonState.Pressed && button.pressed) {
          state.buttonStates.set(index, ButtonState.Held);
        } else if (previousState && previousState !== ButtonState.Released && !button.pressed) {
          state.buttonStates.set(index, ButtonState.Released);
        } else if (previousState === ButtonState.Released && !button.pressed) {
          state.buttonStates.delete(index);
        }
      });
    });
  }

  /**
   * Handles the ContextMenu event
   * @param {Event} event the event
   */
  private onContextMenu = (event: Event) => {
    if (!this.enabled) return;
    event.preventDefault();
  };

  /**
   * Handles the pointer down event
   * @param {PointerEvent} event the pointer event
   */
  private onPointerDown = (event: PointerEvent): void => {
    const type = Input.stringToInputMap.get(event.pointerType);
    switch (type) {
      case InputType.Mouse:
      case InputType.Pen:
        const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
        state.coordinates.set(event.pageX, event.pageY);
        state.buttonStates.set(event.button, ButtonState.Pressed);
        break;
      case InputType.Touch:
        const touchState = this.pointerStates.set(event.pointerId, type, event.isPrimary);
        touchState.coordinates.set(event.pageX, event.pageY);
        break;
    }
  };

  /**
   * Handles the pointer move event
   * @param {PointerEvent} event the pointer event
   */
  private onPointerMove = (event: PointerEvent): void => {
    const type = Input.stringToInputMap.get(event.pointerType);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);

      // Set to current
      this.reusableVector.set(event.pageX, event.pageY);

      // Calculate delta
      this.reusableVector.sub(state.coordinates);

      // Update state
      state.coordinates.set(event.pageX, event.pageY);
      state.delta.add(this.reusableVector);
    }
  };

  /**
   * Handles the pointer up event
   * @param {PointerEvent} event the pointer event
   */
  private onPointerUp = (event: PointerEvent): void => {
    const type = Input.stringToInputMap.get(event.pointerType);
    switch (type) {
      case InputType.Mouse:
      case InputType.Pen:
        const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
        state.buttonStates.set(event.button, ButtonState.Released);
        break;
      case InputType.Touch:
        this.pointerStates.delete(event.pointerId);
        break;
    }
  };

  /**
   * Handles the pointer cancel event
   * @param {PointerEvent} event the pointer event
   */
  private onPointerCancel = (event: PointerEvent): void => {
    const type = Input.stringToInputMap.get(event.pointerType);
    if (type) {
      const state = this.pointerStates.set(event.pointerId, type, event.isPrimary);
      state.buttonStates.delete(event.button);
    }
  };

  /**
   * Handles the key down event
   * @param {KeyboardEvent} event the keyboard event
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Pressed);
  };

  /**
   * Handles the key up event
   * @param {KeyboardEvent} event the keyboard event
   */
  private onKeyUp = (event: KeyboardEvent): void => {
    this.keyStates.set(event.key, ButtonState.Released);
  };

  /**
   * Handles the wheel/scroll event for a mouse or touchpad
   * @param {WheelEvent} event the wheel event
   */
  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();

    this.mouseScrollDelta.set(event.deltaX, event.deltaY);
    this._mouseScrollDeltaMode = event.deltaMode;
  };

  /**
   * Handles the gamepad connected window event
   * @param {GamepadEvent} event the gamepad event
   */
  private onGamepadConnected = (event: GamepadEvent): void => {
    const state = this.gamepadStates.set(event.gamepad.id, event.gamepad.index, event.gamepad.timestamp);

    if (event.gamepad.mapping !== 'standard') {
      console.warn('Connected gamepad %s does not support standard mapping', event.gamepad.id);
    }

    console.log(
      'Gamepad connected with %d button and %d axes as player %d',
      state.totalButtons,
      state.totalAxes,
      state.playerIndex + 1,
    );
  };

  /**
   * Handles the gamepad disconnected window event
   * @param {GamepadEvent} event the gamepad event
   */
  private onGamepadDisconnected = (event: GamepadEvent): void => {
    this.gamepadStates.delete(event.gamepad.id);
  };
}

export default Input;
