import * as THREE from 'three';
import { Entity, Input, UnithreeState } from 'unithree';
import { OrbitControls } from 'three-stdlib';

export class CharacterCapsule extends Entity {
  private static FORWARD = new THREE.Vector3(0, 0, -1);
  private static BACK = new THREE.Vector3(0, 0, 1);
  private static LEFT = new THREE.Vector3(-1, 0, 0);
  private static RIGHT = new THREE.Vector3(1, 0, 0);
  private static SPEED = 15;

  private input: Input | null = null;
  private controls: OrbitControls | null = null;

  constructor(color: THREE.ColorRepresentation = 0x007777) {
    super();

    // Create our cube
    const geometry = new THREE.CapsuleGeometry(3, 9, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const capsule = new THREE.Mesh(geometry, material);
    const capsuleBounds = new THREE.Box3().setFromObject(capsule);
    capsule.position.y = capsuleBounds.max.y / 2 + 4;
    this.add(capsule);
  }

  private createOrbitControls = () => {
    if (this.controls) {
      this.controls.dispose();
    }

    this.controls = new OrbitControls(
      UnithreeState.getCamera() as THREE.PerspectiveCamera,
      UnithreeState.getRenderer().domElement,
    );

    this.controls.target = this.position;
    this.controls.keys = { LEFT: '', RIGHT: '', UP: '', BOTTOM: '' };
    this.controls.minDistance = 20;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2;
  };

  public onStart(deltaTime: number, isPaused: boolean): this {
    super.onStart(deltaTime, isPaused);
    this.input = UnithreeState.getPluginByTypeName<Input>('Input');
    this.createOrbitControls();
    return this;
  }

  public onUpdate(deltaTime: number, isPaused: boolean): this {
    super.onUpdate(deltaTime, isPaused);

    // TODO: Bug: Necessary due to a second render in React
    if (
      this.controls?.object !== UnithreeState.getCamera() ||
      this.controls?.domElement !== UnithreeState.getRenderer().domElement
    ) {
      this.createOrbitControls();
    }

    const camera = this.controls?.object as THREE.PerspectiveCamera;
    this.rotation.y = camera.rotation.y;

    if (this.input?.getKeyDown('ArrowUp') || this.input?.getKeyDown('w')) {
      const pLocal = CharacterCapsule.FORWARD.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('ArrowDown') || this.input?.getKeyDown('s')) {
      const pLocal = CharacterCapsule.BACK.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    if (this.input?.getKeyDown('ArrowLeft') || this.input?.getKeyDown('a')) {
      const pLocal = CharacterCapsule.LEFT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('ArrowRight') || this.input?.getKeyDown('d')) {
      const pLocal = CharacterCapsule.RIGHT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    if (this.controls) {
      this.controls.target = this.position;
      this.controls.update();
    }

    return this;
  }
}
