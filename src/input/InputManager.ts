export class InputManager {
  private static _instance: InputManager | null = null;

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
}
