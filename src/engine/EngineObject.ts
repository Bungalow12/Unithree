/**
 * Main GameObject class. Think MonoBehaviour
 */
export abstract class EngineObject {
  constructor() {
    this.update = this.update.bind(this);
  }

  /**
   * Updates is called once per frame
   * @param delta the time since the last update
   */
  update(delta: number): void {
    // Do nothing by default
  }
}
