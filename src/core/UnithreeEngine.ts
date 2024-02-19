import * as THREE from 'three';
import { Entity } from './Entity';
import { UnithreePlugin } from './UnithreePlugin';

/**
 * Unithree engine root. Used for all the minimal requirements to run the system.
 */
export class UnithreeEngine {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private needsUpdate = true;

  private entities: Entity[] = [];
  private plugins: UnithreePlugin[] = [];

  // TODO: Add a SceneLoader that takes the custom object types so that the loader would know how to process them
  //  Needs a file format.

  /**
   * Instantiates a new Unithree engine
   * @param {THREE.Camera} camera ThreeJS based camera. Defaults to Perspective Camera
   * @param {THREE.WebGLRenderer} renderer ThreeJS Renderer with default
   * @param plugins Plugin Implementations for Unithree
   */
  constructor(
    camera: THREE.Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
    renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer(),
    plugins: UnithreePlugin[] = [],
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.plugins = plugins;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
  }

  private discoverEntities = () => {
    this.scene.traverse((child) => {
      if (child instanceof Entity) {
        this.entities.push(child);
      }
    });
  };

  /**
   * The main animation loop. This will process plugins and Entity children to provide callbacks for each entity
   */
  private animationLoop = () => {
    requestAnimationFrame(this.animationLoop);

    if (this.needsUpdate) {
      this.needsUpdate = false;
      this.discoverEntities();
    }

    // Handle start / destroy
    const toDelete: Entity[] = [];
    this.entities.forEach((entity) => {
      if (!entity.didStart) {
        entity.onStart(this.clock.getDelta());
      }

      if (entity.isDead) {
        toDelete.push(entity);
      }
    });

    toDelete.forEach((entity) => {
      entity.removeFromParent();
    });

    this.renderer.render(this.scene, this.camera);

    // Run the plugins attached
    this.plugins.forEach((plugin) => {
      plugin.run();
    });

    // Handle Update
    this.entities.forEach((entity) => {
      entity.onUpdate(this.clock.getDelta());
    });
    this.entities.forEach((entity) => {
      entity.onLateUpdate(this.clock.getDelta());
    });
  };
}
