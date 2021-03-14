import * as THREE from 'three';
import { GameObject } from './GameObject';

export type UI<T extends THREE.Object3D = THREE.Object3D> = GameObject<T>;

export enum UIMode {
  /**
   * Standard Perspective Camera Scene.
   * This is good for custom UI built from GameObjects.
   * @type {UIMode.Perspective}
   */
  Perspective,
  /**
   * Standard Orthographic Camera Scene.
   * This is good for custom UI built from GameObjects.
   * @type {UIMode.Orthographic}
   */
  Orthographic,
  /**
   * Standard Stereo Camera Scene.
   * This is good for custom UI built from GameObjects.
   * @type {UIMode.Stereo}
   */
  Stereo,
  /**
   * Renders CSS based web elements flat on top of the scene.
   * @type {UIMode.CSS2D}
   */
  CSS2D,
  /**
   * Renders CSS based web elements in world space on top of the scene.
   * @type {UIMode.CSS3D}
   */
  CSS3D,
  /**
   * Renders CSS based web elements flat on top of the scene.
   * For use in VR/AR
   * @type {UIMode.CSS2DStereo}
   */
  CSS2DStereo,
  /**
   * Renders CSS based web elements in world space on top of the scene.
   * For use in VR/AR
   * @type {UIMode.CSS3DStereo}
   */
  CSS3DStereo,
}
