import { Object3D } from 'three';

import { Component } from './Component';

type EntityChildren = Object3D | Entity | Component;

/**
 * The main Unithree engine object. This is an Object3D at its base with the updated processing
 */
export class Entity extends Object3D {
  private isEntity = true;
  private isEnabled;

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
  }

  public onStart(deltaTime: number): void {
    this.didStart = true;
  }

  public onUpdate(deltaTime: number): void {
  }

  public onLateUpdate(deltaTime: number): void {
  }

  public onDestroy(deltaTime: number): void {
    this.isDead = true;
  }

// eslint-disable-next-line prettier/prettier
  public override add(...objects: EntityChildren[]): this {
    super.add(...objects as never[])
    return this;
  }

  public destroy() {
    this.isDead = true;
  }
}
