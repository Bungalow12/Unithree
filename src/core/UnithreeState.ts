import * as THREE from 'three';
import { Entity } from './Entity';
import { UnithreePlugin } from './UnithreePlugin';

/**
 * Unithree engine root. Used for all the minimal requirements to run the system.
 */

// TODO: Add a SceneLoader that takes the custom object types so that the loader would know how to process them
//  Needs a file format.

type UnithreeObject = THREE.Object3D | Entity;

class UnithreeScene extends THREE.Scene {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public add(...object: THREE.Object3D[]): this {
    console.error('Please use Unithree.instantiateObject instead.');
    return this;
  }
}

let _camera: THREE.Camera;
let _renderer: THREE.WebGLRenderer;
let animationLoopId: number;
let isPaused = false;

const scene: THREE.Scene = new UnithreeScene();
const clock: THREE.Clock = new THREE.Clock();

const entities: Map<string, Entity> = new Map<string, Entity>();
const plugins: UnithreePlugin[] = [];

/**
 * The main animation loop. This will process plugins and Entity children to provide callbacks for each entity
 */
const animationLoop = () => {
  animationLoopId = requestAnimationFrame(animationLoop);

  // Handle start / destroy
  const toDelete: Entity[] = [];
  entities.forEach((entity) => {
    entity.onStart(clock.getDelta(), isPaused);

    if (entity.isDead) {
      toDelete.push(entity);
    }
  });

  toDelete.forEach((entity) => {
    entity.removeFromParent();
    const removeIds: string[] = [entity.uuid];
    entity.traverse((child) => {
      if (child instanceof Entity) {
        removeIds.push(child.uuid);
      }
    });

    // Remove from watched entities
    removeIds.forEach((uuid) => entities.delete(uuid));
  });

  _renderer.render(scene, _camera);

  // Run the plugins attached
  plugins.forEach((plugin) => {
    plugin.run();
  });

  // Handle Update
  entities.forEach((entity) => {
    entity.onUpdate(clock.getDelta(), isPaused);
  });
  entities.forEach((entity) => {
    entity.onLateUpdate(clock.getDelta(), isPaused);
  });
};

/**
 * Adds a new plugin to the Unithree system
 * @param {UnithreePlugin} plugins 1 or more plugins
 */
const addPlugins = (...plugins: UnithreePlugin[]): void => {
  plugins.push(...plugins);
};

/**
 * Initializes the Unithree system
 * @param {THREE.Camera} camera Optional camera replacement. Default: PerspectiveCamera
 * @param {THREE.WebGLRenderer} renderer Optional renderer/ Default WebGLRenderer
 * @returns {HTMLCanvasElement} The Canvas element for the renderer.
 */
const initialize = (camera?: THREE.Camera, renderer?: THREE.WebGLRenderer): HTMLCanvasElement => {
  _camera = camera ?? new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  _renderer = renderer ?? new THREE.WebGLRenderer();

  _renderer.setSize(window.innerWidth, window.innerHeight);
  return _renderer.domElement;
};

/**
 * Starts the main loop
 */
const start = (): void => {
  animationLoop();
};

/**
 * Stops the main loop
 */
const stop = (): void => {
  cancelAnimationFrame(animationLoopId);
};

/**
 * Instantiates a new object and adds it to the scene
 * @param {UnithreeObject} object the new object or Entity to add
 * @param {THREE.Object3D} parent the optional parent object
 * @returns {UnithreeObject} the object that has been added
 */
const instantiateObject = (object: UnithreeObject, parent?: THREE.Object3D): UnithreeObject => {
  parent = parent ?? scene;
  if (object instanceof Entity) {
    entities.set(object.uuid, object);
  }

  object.traverse((child) => {
    if (child instanceof Entity) {
      entities.set(child.uuid, child);
    }
  });
  parent.add(object);

  return object;
};

/**
 * The Unithree system state object. This provides access to the scene, renderer and active camera and processes the animation loop
 */
export const UnithreeState = {
  addPlugins,
  initialize,
  start,
  stop,
  instantiateObject,
  get isPaused(): boolean {
    return isPaused;
  },
  set isPaused(value: boolean) {
    isPaused = value;
  },
  getScene: (): THREE.Scene => scene,
  getCamera: (): THREE.Camera => _camera,
  setCamera: (camera: THREE.Camera): void => {
    _camera = camera;
  },
  getRenderer: (): THREE.WebGLRenderer => _renderer,
  getClock: (): THREE.Clock => clock,
};
