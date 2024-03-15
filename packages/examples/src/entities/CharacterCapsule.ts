import {
  Box3,
  CapsuleGeometry,
  ColorRepresentation,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import Unithree from 'unithree';
import Entity from 'unithree/dist/core/Entity';
import Input from 'unithree/dist/plugin/Input';
import { ThirdPersonCameraController } from '../components';

export class CharacterCapsule extends Entity {
  private static FORWARD = new Vector3(0, 0, -1);
  private static BACK = new Vector3(0, 0, 1);
  private static LEFT = new Vector3(-1, 0, 0);
  private static RIGHT = new Vector3(1, 0, 0);
  private static SPEED = 15;

  private input: Input | null = null;
  // private controls: OrbitControls | null = null;
  private readonly controls: ThirdPersonCameraController;

  constructor(input: Input, color: ColorRepresentation = 0x007777) {
    super();

    // Create our cube
    const geometry = new CapsuleGeometry(3, 9, 16, 16);
    const material = new MeshStandardMaterial({ color });
    const capsule = new Mesh(geometry, material);
    const capsuleBounds = new Box3().setFromObject(capsule);
    capsule.position.y = capsuleBounds.max.y / 2 + 4;
    this.add(capsule);

    const camera = Unithree.getCamera() as PerspectiveCamera;
    const domElement = Unithree.getRenderer().domElement;
    this.controls = new ThirdPersonCameraController(camera, domElement, input);
    this.addComponent(this.controls);
  }

  private createOrbitControls = () => {
    if (this.controls) {
      this.controls.dispose();
    }

    // this.controls = new OrbitControls(Unithree.getCamera() as PerspectiveCamera, Unithree.getRenderer().domElement);
    const camera = Unithree.getCamera() as PerspectiveCamera;
    const domElement = Unithree.getRenderer().domElement;
    this.controls.initialize(camera, domElement);

    this.controls.target = this.position;
    this.controls.keys = { LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', UP: 'ArrowUp', DOWN: 'ArrowDown' };
    this.controls.minDistance = 20;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2;
  };

  public onStart(deltaTime: number, isPaused: boolean): this {
    super.onStart(deltaTime, isPaused);
    this.input = Unithree.getPluginByTypeName<Input>('Input');
    this.createOrbitControls();
    return this;
  }

  public onUpdate(deltaTime: number, isPaused: boolean): this {
    super.onUpdate(deltaTime, isPaused);

    const camera = this.controls.camera as PerspectiveCamera;
    this.rotation.y = camera.rotation.y;

    if (this.input?.getKeyDown('w')) {
      const pLocal = CharacterCapsule.FORWARD.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('s')) {
      const pLocal = CharacterCapsule.BACK.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    if (this.input?.getKeyDown('a')) {
      const pLocal = CharacterCapsule.LEFT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('d')) {
      const pLocal = CharacterCapsule.RIGHT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.position).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    this.controls.target = this.position;

    return this;
  }
}
