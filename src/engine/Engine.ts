import * as THREE from "three";

import { GameObject } from "./GameObject";
import { Object3D, Scene, SupportedCamera } from "./Types";
import { EngineObject } from "./EngineObject";

export class Engine {
  clearColor = 0x21252c;
  fov = 75;
  near = 0.01;
  far = 1000;

  private static _instance: Engine | null = null;

  private readonly clock: THREE.Clock = new THREE.Clock();
  private readonly renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  private readonly scene: THREE.Scene = new THREE.Scene();
  private readonly gameObjects: Array<EngineObject> = new Array<EngineObject>();

  private mainCamera: SupportedCamera = new THREE.PerspectiveCamera(this.fov);

  /**
   * Gets Instance of the GameEngine
   */
  static get instance(): Engine {
    if (!this._instance) {
      this._instance = new Engine();
    }
    return this._instance;
  }

  /**
   * Adds a basic Object3D to the scene.
   * @param {Object3D} object
   */
  add = (object: Object3D): void => {
    this.addGameObject<Object3D>(new GameObject<Object3D>(object));
  };

  /**
   * Adds a GameObject to the scene.
   * @param {GameObject} gameObject
   * @
   */
  addGameObject = <T extends Object3D>(gameObject: GameObject<T>): void => {
    this.gameObjects.push(gameObject);
    this.scene.add(gameObject.object);
  };

  /**
   * Add multiple objects to the scene.
   * @param {GameObject[]} gameObjects
   */
  addAllGameObjects = <T extends Object3D>(
    gameObjects: GameObject<T>[]
  ): void => {
    gameObjects.forEach((object) => {
      this.addGameObject<T>(object);
    });
  };

  /**
   * Add multiple objects to the scene.
   * @param {Object3D[]} objects
   */
  addAll = (objects: Object3D[]): void => {
    objects.forEach((object) => {
      this.add(object);
    });
  };

  /**
   * Merges 2 scenes
   * @param {Scene} scene
   */
  addScene = (scene: Scene): void => {
    // TODO: Find any GameObjects to add to the processor list
    this.scene.add(scene);
  };

  private constructor() {
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = true;
    if (Engine.isBrowser()) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    requestAnimationFrame(this.gameLoop);
  }

  private render = (delta: number): void => {
    const { clientHeight, clientWidth } = this.renderer.domElement;
    this.renderer.setClearColor(this.clearColor);
    this.renderer.setViewport(0, 0, clientWidth, clientHeight);
    this.renderer.render(this.scene, this.mainCamera);
  };

  private update = (delta: number): void => {
    this.gameObjects.forEach((gameObject) => {
      gameObject.update(delta);
    });
  };

  private gameLoop = () => {
    const delta = this.clock.getDelta();

    requestAnimationFrame(this.gameLoop);

    this.update(delta);
    this.render(delta);
  };

  /**
   * Is the Engine running in a browser
   * @returns {boolean} true if the engine is running in a browser
   */
  static isBrowser = (): boolean => {
    return typeof window !== undefined;
  };

  /**
   * Is the OS Mac
   * @returns {boolean} true if the OS is Mac
   */
  static isMac = (): boolean => {
    return Engine.isBrowser && /Mac/.test(navigator.platform);
  };
}
