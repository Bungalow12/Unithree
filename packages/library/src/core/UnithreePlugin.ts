/**
 * The type of execution for a plugin
 */
export enum ExecutionType {
  ONCE,
  ALWAYS,
}

/**
 * The Plugin interface for Unithree.
 */
export interface UnithreePlugin {
  executionType: ExecutionType;

  run(): void;
}
