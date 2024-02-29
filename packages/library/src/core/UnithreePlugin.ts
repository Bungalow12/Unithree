/**
 * The type of execution for a plugin
 */
export enum ExecutionType {
  Once,
  Always,
}

/**
 * The Plugin interface for Unithree.
 */
export interface UnithreePlugin {
  executionType: ExecutionType;

  run(deltaTime: number, isPaused: boolean): void;
}
