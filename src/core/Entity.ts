import { Object3D } from 'three';

import { Component } from './Component';

/**
 * The main Unithree engine object. This is an Object3D at its base with the updated processing
 */
export class Entity extends Object3D {
  protected isEntity = true;
  protected isEnabled;
  protected components: Component[] = [];

  public didStart = false;
  public isDead = false;

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public set enabled(value: boolean) {
    this.isEnabled = value;
  }

  constructor(isEnabled = true) {
    super();
    this.isEnabled = isEnabled;
    this.onStart = this.onStart.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.onLateUpdate = this.onLateUpdate.bind(this);
    this.onDestroy = this.onDestroy.bind(this);
  }

  public onStart(deltaTime: number): void {
    this.didStart = true;
  }

  public onUpdate(deltaTime: number): void {
    // Does nothing
  }

  public onLateUpdate(deltaTime: number): void {
    // Does nothing
  }

  public onDestroy(deltaTime: number): void {
    this.isDead = true;
  }

  public add(...objects: Object3D[]): this {
    console.error('Please use Unithree.instantiateObject instead.');
    return this;
  }

  public addComponent = (...components: Component[]): this => {
    this.components.push(components);
    return this;
  };

  public destroy = (): void => {
    this.isDead = true;
  };
}
