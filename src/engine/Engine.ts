import * as THREE from "three";

import { GameObject } from "./GameObject";
import { Object3D, Scene, Vector2 } from "./Types";
import { Camera } from "./Camera";
import { Input } from "../input/InputManager";

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
  private readonly scene = new THREE.Scene();
  private readonly gameObjects = new Map<string, GameObject>();

  private readonly gameObjectNameMap = new Map<string, string>();

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

  get domElement(): HTMLElement {
    return this.renderer.domElement;
  }

  get viewHalfSize(): Vector2 {
    return new THREE.Vector2(
      this.renderer.domElement.offsetWidth / 2,
      this.renderer.domElement.offsetHeight / 2
    );
  }

  /**
   * Adds an object to the scene.
   * @param {Object3D | GameObject} object to add to the scene
   */
  addObjectToScene = <T extends Object3D = Object3D>(
    object: Object3D | GameObject<T>
  ): void => {
    if (object instanceof THREE.Object3D) {
      this.addGameObject<Object3D>(new GameObject(object));
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
    if (gameObject.object.name) {
      this.gameObjectNameMap.set(
        gameObject.object.name,
        gameObject.object.uuid
      );
    }

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

  /**
   * Removes the object from the scene
   * @param {Object3D | GameObject} gameObject
   */
  removeObjectFromScene = (gameObject: Object3D | GameObject): void => {
    const object: Object3D =
      gameObject instanceof THREE.Object3D ? gameObject : gameObject.object;

    if (object.name) {
      this.gameObjectNameMap.delete(object.name);
    }
    this.gameObjects.delete(object.uuid);
    this.scene.remove(object);
  };

  setMainCamera = (camera: Camera): void => {
    this.mainCamera = camera;
  };

  private constructor() {
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = true;
    this.renderer.domElement.setAttribute("tabIndex", "0");
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

    // Update input after values had the chance to be read by game objects
    Input.instance.update(delta);
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
