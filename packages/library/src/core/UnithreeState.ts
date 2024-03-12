import { Entity } from './Entity';
import { ExecutionType, UnithreePlugin } from './UnithreePlugin';
import { Camera, Clock, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/**
 * Unithree engine root. Used for all the minimal requirements to run the system.
 */

// TODO: Add a SceneLoader that takes the custom object types so that the loader would know how to process them
//  Needs a file format.

type UnithreeObject = Object3D | Entity;

const scene = new Scene();
const clock = new Clock();

let _camera: Camera;
let _renderer: WebGLRenderer;
let animationLoopId: number;
let isPaused = false;
let deltaTime = clock.getDelta();

const entities: Map<string, Entity> = new Map<string, Entity>();
const _plugins: Map<string, UnithreePlugin> = new Map<string, UnithreePlugin>();

/**
 * The main animation loop. This will process plugins and Entity children to provide callbacks for each entity
 */
const animationLoop = () => {
  animationLoopId = requestAnimationFrame(animationLoop);
  deltaTime = clock.getDelta();

  // Handle start / destroy
  const toDelete: Entity[] = [];
  entities.forEach((entity) => {
    if (entity.enabled && !entity.didStart) {
      entity.onStart(deltaTime, isPaused);
      entity.didStart = true;
    }

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
  _plugins.forEach((plugin) => {
    plugin.run(deltaTime, isPaused);
  });

  // Handle Update
  entities.forEach((entity) => {
    if (entity.enabled && !entity.isDead) {
      entity.onUpdate(deltaTime, isPaused);
    }
  });
  entities.forEach((entity) => {
    if (entity.enabled && !entity.isDead) {
      entity.onLateUpdate(deltaTime, isPaused);
    }
  });
};

/**
 * Adds a new plugin to the Unithree system
 * @param {UnithreePlugin} plugins 1 or more plugins
 */
const addPlugins = (...plugins: UnithreePlugin[]): void => {
  plugins.forEach((plugin) => {
    switch (plugin.executionType) {
      case ExecutionType.Once:
        plugin.run(deltaTime, isPaused);
        break;

      case ExecutionType.Always:
      default:
        _plugins.set(plugin.constructor.name, plugin);
    }
  });
};

/**
 * GEts a plugin class by the name of the type as a string
 * @param {string} typeName class name as a string
 * @returns {UnithreePlugin | null} The plugin cast to the specified type
 */
const getPluginByTypeName = <T extends UnithreePlugin>(typeName: string): T | null => {
  return (_plugins.get(typeName) as T) ?? null;
};

/**
 * Initializes the Unithree system
 *
 * @param {WebGLRenderer} renderer Optional renderer/ Default WebGLRenderer
 * @param {Camera} camera Optional camera replacement. Default: PerspectiveCamera
 * @returns {HTMLCanvasElement} The Canvas element for the renderer.
 */
const initialize = (renderer?: WebGLRenderer, camera?: Camera): HTMLCanvasElement => {
  _renderer = renderer ?? new WebGLRenderer();
  _camera = camera ?? new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  _renderer.autoClear = true;
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
 * @param {Object3D} parent the optional parent object
 * @returns {UnithreeObject} the object that has been added
 */
const instantiateObject = (object: UnithreeObject, parent?: Object3D): UnithreeObject => {
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
 * Finds an Object by name.
 * WARNING: This can be slow. It is not suggested to do this often rather maintain a reference.
 * @param {string} name the name of the object to find
 * @returns {Object3D | null} the object or null
 */
const findObjectByName = (name: string): Object3D | null => {
  if (!name) return null; // Too many items use empty names
  return scene.getObjectByName(name) ?? null;
};

/**
 * Finds all Objects with a name.
 * WARNING: This can be slow. It is not suggested to do this often rather maintain a reference.
 * @param {string} name the name of the objects to find
 * @returns {Object3D | null} the object list or null
 */
const findObjectsByName = (name: string): Object3D[] | null => {
  if (!name) return null; // Too many items use empty names
  return scene.getObjectsByProperty('name', name) ?? null;
};

/**
 * Finds an entity in the known entities list.
 * WARNING: This can be slow. This will look for an entity by name in a list of known entities. This should be faster than findObjectByName.
 * @param {string} name the name of the entity
 * @returns {Entity | null} the entity or null
 */
const findEntityByName = (name: string): Entity | null => {
  for (const entity of entities.values()) {
    if (entity.name === name) return entity;
  }

  return null;
};

/**
 * Finds all entities in the known entities list.
 * WARNING: This can be slow. This will look for an entity by name in a list of known entities. This should be faster than findObjectByName.
 * @param {string} name the name of the entities
 * @returns {Entity[] | null} the entity list or null
 */
const findEntitiesByName = (name: string): Entity[] | null => {
  const matched: Entity[] = [];
  for (const entity of entities.values()) {
    if (entity.name === name) {
      matched.push(entity);
    }
  }

  return matched;
};

/**
 * The Unithree system state object. This provides access to the scene, renderer and active camera and processes the animation loop
 */
export const UnithreeState = {
  addPlugins,
  getPluginByTypeName,
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
  getScene: (): Scene => scene,
  getCamera: (): Camera => _camera,
  setCamera: (camera: Camera): void => {
    _camera = camera;
  },
  getRenderer: (): WebGLRenderer => _renderer,
  getClock: (): Clock => clock,
  findObjectByName,
  findObjectsByName,
  findEntityByName,
  findEntitiesByName,
};
