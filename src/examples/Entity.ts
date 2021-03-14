import * as THREE from 'three';
import { Engine, GameObject } from '../engine';
import { approximatelyVector3Equal, FPS_60 } from '../utilities/MathUtilities';

/**
 * Example of a class that adds basic actions and smooth transformations to a standard Game Object
 */
export class Entity<T extends THREE.Object3D> extends GameObject<T> {
  protected targetPosition = new THREE.Vector3();
  protected targetPositionEnd = this.targetPosition.clone();
  protected lookAtTarget = new THREE.Vector3();
  protected lookAtTargetEnd: THREE.Vector3 | null = null;
  protected rotation = new THREE.Euler();
  protected rotationEnd: THREE.Euler = this.rotation.clone();

  protected moveToCallback: ((target: THREE.Vector3) => void) | undefined;
  protected moveToErrorCallback: ((error: Error) => void) | undefined;
  protected lookAtCallback: ((target: THREE.Vector3) => void) | undefined;
  protected lookAtErrorCallback: ((error: Error) => void) | undefined;

  dampingFactor = 0.05;

  constructor(object: T) {
    super(object);

    this.rotate = this.rotate.bind(this);
    this.rotateTo = this.rotateTo.bind(this);
    this.move = this.move.bind(this);
    this.forward = this.forward.bind(this);
    this.backward = this.backward.bind(this);
  }

  /**
   * Rotates the object by the specified degrees on each axis.
   * @param {number} deltaXAngle in radians
   * @param {number} deltaYAngle in radians
   * @param {number} deltaZAngle in radians
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  rotate(deltaXAngle: number, deltaYAngle: number, deltaZAngle: number, smooth = true): void {
    const currentRotation = this.rotationEnd ?? this.object.rotation;
    this.rotateTo(currentRotation.x + deltaXAngle, currentRotation.y + deltaYAngle, currentRotation.z + deltaZAngle);
  }

  /**
   * Rotates the object to the specified degrees on each axis.
   * @param {number} xAngle rotation angle X-Axis in radians
   * @param {number} yAngle rotation angle Y-Axis in radians
   * @param {number} zAngle rotation angle Z-Axis in radians
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  rotateTo(xAngle: number, yAngle: number, zAngle: number, smooth = true): void {
    this.rotationEnd = new THREE.Euler(xAngle, yAngle, zAngle);

    if (!smooth) {
      this.rotation.copy(this.rotationEnd);
    }
  }

  /**
   * Moves the object the desired delta in each direction.
   * @param {number} deltaX
   * @param {number} deltaY
   * @param {number} deltaZ
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  move(deltaX: number, deltaY: number, deltaZ: number, smooth = true): void {
    this.targetPositionEnd.set(
      this.targetPositionEnd.x + deltaX,
      this.targetPositionEnd.y + deltaY,
      this.targetPositionEnd.z + deltaZ,
    );

    if (!smooth) {
      this.targetPosition.copy(this.targetPositionEnd);
    }
  }

  /**
   * Move forward in the direction of the object
   * @param {number} delta
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  forward(delta: number, smooth = true): void {
    const camera = Engine.instance.getMainCamera()?.object;
    if (camera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      this.targetPositionEnd.addScaledVector(direction, delta);

      if (!smooth) {
        this.targetPosition.copy(this.targetPositionEnd);
      }
    }
  }

  /**
   * Move backward in the direction of the object
   * @param {number} delta
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  backward(delta: number, smooth = true): void {
    this.forward(-delta, smooth);
  }

  /**
   * Moves the entity to a specific location
   * @param {THREE.Vector3 | THREE.Object3D | GameObject} target
   * @param {boolean} smooth
   * @returns {Promise<THREE.Vector3>}
   */
  moveTo(target: THREE.Vector3 | THREE.Object3D | GameObject, smooth = true): Promise<THREE.Vector3> {
    this.targetPositionEnd = GameObject.extractPosition(target);

    return new Promise<THREE.Vector3>((resolve, reject) => {
      if (!smooth) {
        this.targetPosition.copy(this.targetPositionEnd);
        resolve(this.targetPositionEnd);
        return;
      }
      this.moveToCallback = resolve;
      this.moveToErrorCallback = reject;
    });
  }

  /**
   * Makes the entity look at a specific location.
   * @param {THREE.Vector3 | THREE.Object3D | GameObject} target
   * @param {boolean} smooth
   * @returns {Promise<THREE.Vector3>}
   */
  lookAt(target: THREE.Vector3 | THREE.Object3D | GameObject, smooth = true): Promise<THREE.Vector3> {
    const targetPosition = GameObject.extractPosition(target);
    this.lookAtTargetEnd = targetPosition;

    return new Promise<THREE.Vector3>((resolve, reject) => {
      if (!smooth) {
        this.lookAtTarget.copy(targetPosition);
        resolve(targetPosition);
        return;
      }
      this.lookAtCallback = resolve;
      this.lookAtErrorCallback = reject;
    });
  }

  /**
   * Overrides update to process smooth movement.
   * @param {number} delta time since last frame
   */
  update(delta: number): void {
    this.updateMotion(delta);
    this.updatePromises();
    this.updateObject();
  }

  /**
   * Gets the lerp ratio based on the time since last frame and applying damping
   * @param {number} delta time since last frame
   * @returns {number}
   */
  protected getLerpRatio = (delta: number): number => {
    return 1.0 - Math.exp(-this.dampingFactor * delta * FPS_60);
  };

  /**
   * Updates the values for smooth motion
   * @param {number} delta time since last frame
   */
  protected updateMotion = (delta: number): void => {
    const lerpRatio = this.getLerpRatio(delta);

    const lookAtPosition = this.lookAtTargetEnd ?? this.lookAtTarget;
    const deltaTargetPosition = new THREE.Vector3().subVectors(this.targetPositionEnd, this.targetPosition);
    const deltaLookAtTarget = new THREE.Vector3().subVectors(lookAtPosition, this.lookAtTarget);
    const deltaRotation = new THREE.Euler(
      this.rotationEnd.x - this.rotation.x,
      this.rotationEnd.y - this.rotation.y,
      this.rotationEnd.z - this.rotation.z,
    );

    if (approximatelyVector3Equal(this.targetPositionEnd, this.targetPosition)) {
      this.targetPosition.copy(this.targetPositionEnd);
    } else {
      this.targetPosition.add(deltaTargetPosition.multiplyScalar(lerpRatio));
    }

    if (approximatelyVector3Equal(lookAtPosition, this.lookAtTarget)) {
      this.lookAtTarget.copy(lookAtPosition);
    } else {
      this.lookAtTarget.add(deltaLookAtTarget.multiplyScalar(lerpRatio));
    }

    if (approximatelyVector3Equal(this.rotationEnd.toVector3(), this.rotation.toVector3())) {
      this.rotation.copy(this.rotationEnd);
    } else {
      this.rotation.set(
        this.rotation.x + deltaRotation.x * lerpRatio,
        this.rotation.y + deltaRotation.y * lerpRatio,
        this.rotation.z + deltaRotation.z * lerpRatio,
      );
    }
  };

  /**
   * Fires promises if necessary
   */
  protected updatePromises = (): void => {
    if (this.moveToCallback && this.targetPosition.equals(this.targetPositionEnd)) {
      this.moveToCallback(this.targetPosition);
      this.moveToCallback = undefined;
      this.moveToErrorCallback = undefined;
    }

    const lookAtPosition = this.lookAtTargetEnd ?? this.lookAtTarget;
    if (this.lookAtCallback && this.lookAtTarget.equals(lookAtPosition)) {
      this.lookAtCallback(this.lookAtTarget);
      this.lookAtCallback = undefined;
      this.lookAtErrorCallback = undefined;
    }
  };

  /**
   * Updates the actual position and rotation of the object.
   */
  protected updateObject = (): void => {
    const camera = Engine.instance.getMainCamera();
    if (!camera) {
      return;
    }

    if (this.lookAtTargetEnd && this.lookAtTarget.equals(this.lookAtTargetEnd)) {
      this.lookAtTargetEnd = null;
      this.rotationEnd.copy(this.object.rotation);
      this.rotation.copy(this.rotationEnd);
    }

    this.object.rotation.copy(this.rotation);
    this.object.position.copy(this.targetPosition);
    this.object.updateMatrixWorld(true);

    if (this.lookAtTargetEnd) {
      this.object.lookAt(this.lookAtTarget);
    }
  };
}
