import { Object3D } from 'three';

import { Component } from './Component';

/**
 * The main Unithree object able to contain components and has event functions called by the system.
 * This is an Object3D at its base with the updated processing.
 */
export class Entity extends Object3D {
  protected isEntity = true;
  protected isEnabled;
  protected _components: Component[] = [];
  protected didStart = false;
  protected _isDead = false;

  /**
   * Get the death state of the Entity
   * @returns {boolean} true if dead
   */
  public get isDead(): boolean {
    return this._isDead;
  }

  /**
   * Get if the entity is enabled
   * @returns {boolean}
   */
  public get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Sets if the entity is enabled
   * @param {boolean} value
   */
  public set enabled(value: boolean) {
    this.isEnabled = value;
  }

  public get components(): Component[] {
    return this._components;
  }

  constructor(isEnabled = true) {
    super();
    this.isEnabled = isEnabled;
    this.onStart = this.onStart.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.onLateUpdate = this.onLateUpdate.bind(this);
    this.onDestroy = this.onDestroy.bind(this);
  }

  /**
   * Event called once on an Entity when it starts
   * @param {number} deltaTime the delta in time
   * @param {boolean} isPaused is the system paused
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onStart(deltaTime: number, isPaused: boolean): void {
    if (this.isEnabled && !this.didStart) {
      this.didStart = true;
    }
  }

  /**
   * Event once per frame post render
   * @param {number} deltaTime the delta in time
   * @param {boolean} isPaused is the system paused
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(deltaTime: number, isPaused: boolean): void {
    if (this._isDead || !this.isEnabled) return;
  }

  /**
   * Event called once per frame after the update event
   * @param {number} deltaTime the delta in time
   * @param {boolean} isPaused is the system paused
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onLateUpdate(deltaTime: number, isPaused: boolean): void {
    if (this._isDead || !this.isEnabled) return;
  }

  /**
   * Event called when the system processed the Entity death.
   * @param {number} deltaTime the delta in time
   * @param {boolean} isPaused is the system paused
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDestroy(deltaTime: number, isPaused: boolean): void {
    this._isDead = true;
  }

  /**
   * Add override to discourage usage
   * @param {Object3D} objects list of objects
   * @returns {this} this object for chaining
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public add(...objects: Object3D[]): this {
    console.error('Please use Unithree.instantiateObject instead.');
    return this;
  }

  /**
   * Adds components to the Entity for extending behavior
   * @param {Component} components the list of components
   * @returns {this} this object for chaining
   */
  public addComponent = (...components: Component[]): this => {
    this._components.push(...components);
    return this;
  };

  /**
   * Tells the Entity it needs to be destroyed. Destruction will happen by the system
   */
  public destroy = (): void => {
    this._isDead = true;
  };
}
