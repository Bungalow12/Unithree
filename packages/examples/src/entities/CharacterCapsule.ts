import {
  Box3,
  CapsuleGeometry,
  ColorRepresentation,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector2,
  Vector3,
} from 'three';
import Unithree from 'unithree';
import Entity from 'unithree/dist/core/Entity';
import Input, { ThumbStick, XBoxButtonMapping } from 'unithree/dist/plugin/Input';
import { ThirdPersonCameraController } from '../components';

const reusableVector = new Vector3();
const reusableVector2 = new Vector2();

export class CharacterCapsule extends Entity {
  private static FORWARD = new Vector3(0, 0, -1);
  private static BACK = new Vector3(0, 0, 1);
  private static LEFT = new Vector3(-1, 0, 0);
  private static RIGHT = new Vector3(1, 0, 0);
  private static SPEED = 15;

  private input: Input | null = null;
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
    this.controls.target = this;
    this.controls.keys = { Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown' };
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
    this.rotation.y = camera.rotation.y; //new Euler().setFromQuaternion(camera.getWorldQuaternion(new Quaternion())).y;

    const gamepad = this.input?.getGamepad(0) ?? null;

    if (this.input?.getKeyDown('w') || gamepad?.getButtonDown(XBoxButtonMapping.Up)) {
      const pLocal = CharacterCapsule.FORWARD.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('s') || gamepad?.getButtonDown(XBoxButtonMapping.Down)) {
      const pLocal = CharacterCapsule.BACK.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    if (this.input?.getKeyDown('a') || gamepad?.getButtonDown(XBoxButtonMapping.Left)) {
      const pLocal = CharacterCapsule.LEFT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    } else if (this.input?.getKeyDown('d') || gamepad?.getButtonDown(XBoxButtonMapping.Right)) {
      const pLocal = CharacterCapsule.RIGHT.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    if (gamepad) {
      const value = gamepad.getThumbStickValue(ThumbStick.Left, reusableVector2);
      value.x = Math.abs(value.x) < 0.17 ? 0 : value.x;
      value.y = Math.abs(value.y) < 0.17 ? 0 : value.y;

      const pLocal = new Vector3(value.x, 0, value.y);
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    // Move forward on touch
    if (this.input?.touchCount === 1) {
      const pLocal = CharacterCapsule.FORWARD.clone();
      const pWorld = pLocal.applyMatrix4(camera.matrixWorld);
      const direction = pWorld.sub(camera.getWorldPosition(reusableVector)).normalize();
      direction.y = 0;
      this.position.addScaledVector(direction, CharacterCapsule.SPEED * deltaTime);
    }

    return this;
  }
}
