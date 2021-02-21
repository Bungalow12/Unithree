import * as THREE from "three";

import { GameObject } from "./GameObject";
import { Object3D, Scene } from "./Types";
import { EngineObject } from "./EngineObject";
import { Camera } from "./Camera";

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
  private readonly gameObjects: Map<string, EngineObject> = new Map<
    string,
    EngineObject
  >();

  private mainCamera: Camera | null = null;

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
   * Adds an object to the scene.
   * @param {Object3D | GameObject} object to add to the scene
   */
  addObjectToScene = <T extends Object3D = Object3D>(
    object: Object3D | GameObject<T>
  ): void => {
    if (object instanceof THREE.Object3D) {
      this.addGameObject<Object3D>(new GameObject<Object3D>(object));
      return;
    }
    this.addGameObject<T>(object);
  };

  /**
   * Adds a GameObject to the scene.
   * @param {GameObject} gameObject
   */
  private addGameObject = <T extends Object3D>(
    gameObject: GameObject<T>
  ): void => {
    this.gameObjects.set(gameObject.object.uuid, gameObject);
    this.scene.add(gameObject.object);
  };

  /**
   * Add multiple objects to the scene.
   * @param {Object3D[]} objects
   */
  addObjectsToScene = (objects: Object3D[]): void => {
    objects.forEach((object) => {
      this.addObjectToScene(object);
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

  setMainCamera = (camera: Camera): void => {
    this.mainCamera = camera;
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

    if (this.mainCamera) {
      this.renderer.render(this.scene, this.mainCamera.object);
    }
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
