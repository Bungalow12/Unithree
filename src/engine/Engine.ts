import * as THREE from 'three';

import { GameObject } from './GameObject';
import { Input } from '../input';
import { Camera } from './Camera';

export class Engine {
  clearColor = 0x21252c;
  fov = 75;
  near = 0.01;
  far = 1000;

  private static _instance: Engine | null = new Engine();

  private readonly clock: THREE.Clock = new THREE.Clock();
  private readonly renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  private readonly scene = new THREE.Scene();
  private readonly gameObjects = new Map<string, GameObject>();

  private readonly gameObjectNameMap = new Map<string, string>();

  private mainCamera: Camera | null = null;
  private _rendererRect: THREE.Vector4 = new THREE.Vector4();

  /**
   * Gets Instance of the GameEngine
   */
  static get instance(): Engine {
    if (!this._instance) {
      this._instance = new Engine();
    }
    return this._instance;
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  get rendererRect(): THREE.Vector4 {
    return this._rendererRect;
  }

  get viewHalfSize(): THREE.Vector2 {
    return new THREE.Vector2(this._rendererRect.width / 2, this._rendererRect.height / 2);
  }

  setRendererSize = (width: number, height: number): void => {
    this.renderer.setSize(width, height);
    this.updateRendererElementRect();
  };

  /**
   * Adds an object to the scene.
   * @param {THREE.Object3D | GameObject} object to add to the scene
   */
  addObjectToScene = <T extends THREE.Object3D = THREE.Object3D>(object: THREE.Object3D | GameObject<T>): void => {
    if (object instanceof THREE.Object3D) {
      this.addGameObject<THREE.Object3D>(new GameObject(object));
      return;
    }
    this.addGameObject<T>(object);
  };

  /**
   * Adds a GameObject to the scene.
   * @param {GameObject} gameObject
   */
  private addGameObject = <T extends THREE.Object3D>(gameObject: GameObject<T>): void => {
    if (gameObject.object.name) {
      this.gameObjectNameMap.set(gameObject.object.name, gameObject.object.uuid);
    }

    this.gameObjects.set(gameObject.object.uuid, gameObject);
    this.scene.add(gameObject.object);
  };

  /**
   * Add multiple objects to the scene.
   * @param {THREE.Object3D[]} objects
   */
  addObjectsToScene = (objects: THREE.Object3D[]): void => {
    objects.forEach((object) => {
      this.addObjectToScene(object);
    });
  };

  /**
   * Merges 2 scenes
   * @param {THREE.Scene} scene
   */
  addScene = (scene: THREE.Scene): void => {
    // TODO: Find any GameObjects to add to the processor list
    this.scene.add(scene);
  };

  /**
   * Removes the object from the scene
   * @param {THREE.Object3D | GameObject} gameObject
   */
  removeObjectFromScene = (gameObject: THREE.Object3D | GameObject): void => {
    const object: THREE.Object3D = gameObject instanceof THREE.Object3D ? gameObject : gameObject.object;

    if (object.name) {
      this.gameObjectNameMap.delete(object.name);
    }
    this.gameObjects.delete(object.uuid);
    this.scene.remove(object);
  };

  /**
   * Clears the whole scene.
   */
  clearScene = (): void => {
    this.gameObjects.clear();
    this.gameObjectNameMap.clear();
    this.scene.clear();
  };

  /**
   * Finds an Object by name.
   * @param {string} name
   * @returns {GameObject | undefined}
   */
  findObjectByName = (name: string): GameObject | undefined => {
    const id = this.gameObjectNameMap.get(name);
    if (id) {
      return this.gameObjects.get(id);
    } else {
      const obj3D = this.scene.getObjectByName(name);

      if (obj3D) {
        return this.gameObjects.get(obj3D.uuid) ?? new GameObject(obj3D);
      }
    }
  };

  /**
   * Gets the main camera.
   * @returns {Camera | null}
   */
  getMainCamera = (): Camera | null => {
    return this.mainCamera;
  };

  /**
   * Sets the main camera to use for rendering.
   * @param {Camera} camera
   */
  setMainCamera = (camera: Camera): void => {
    this.mainCamera = camera;
  };

  private constructor() {
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = true;
    this.renderer.domElement.setAttribute('tabIndex', '0');
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.addEventListener('resize', this.onResize);

    if (Engine.isBrowser) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
      window.addEventListener('resize', this.onResize, false);
    } else {
      document.addEventListener('resize', this.onResize, false);
    }

    requestAnimationFrame(this.gameLoop);
  }

  private updateRendererElementRect = (): void => {
    const domRect = this.renderer.domElement.getBoundingClientRect();
    this._rendererRect.set(domRect.left, domRect.top, domRect.width, domRect.height);
  };

  private onResize = (): void => {
    this.updateRendererElementRect();
  };

  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

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
  static get isBrowser(): boolean {
    return typeof window !== undefined;
  }

  /**
   * Is the OS Mac
   * @returns {boolean} true if the OS is Mac
   */
  static get isMac(): boolean {
    return Engine.isBrowser && /Mac/.test(navigator.platform);
  }
}
