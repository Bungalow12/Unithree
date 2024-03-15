/**
 * The type of execution for a plugin
 */
export enum ExecutionType {
  InitializeOnly,
  Always,
}

/**
 * The Base Plugin for Unithree.
 * Plugins are designed to extend the functionality of the base processing loop.
 * These can be used as standalone additions, Library functionality, and to process custom component types
 */
class ProcessorPlugin {
  public executionType: ExecutionType;
  public enabled = true;
  public initialized = false;

  constructor(executionType: ExecutionType) {
    this.executionType = executionType;

    this.initialize = this.initialize.bind(this);
    this.update = this.update.bind(this);
    this.lateUpdate = this.lateUpdate.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  /**
   * Initializes the plugin
   */
  public initialize(): void {}

  /**
   * Called once per frame alongside Entity onUpdate
   * @param {number} deltaTime the time since the last frame
   * @param {boolean} isPaused True if paused
   */
  public update(deltaTime: number, isPaused: boolean): void {}

  /**
   * Called once per frame after all update calls have completed alongside Entity onLateUpdate
   * @param {number} deltaTime the time since the last frame
   * @param {boolean} isPaused True if paused
   */
  public lateUpdate(deltaTime: number, isPaused: boolean): void {}

  /**
   * Called when the system has been shutdown
   */
  public dispose(): void {}
}

export default ProcessorPlugin;
