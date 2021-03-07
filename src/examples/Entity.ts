import * as THREE from 'three';
import { Engine, GameObject, Object3D, Vector3 } from '..';
import {
  approximatelySphericalEqual,
  approximatelyVector3Equal,
  AXIS_Y,
  FPS_60,
  PI_2,
} from '../utilities/MathUtilities';

/**
 * Example of a class that adds basic actions and smooth transformations to a standard Game Object
 */
export class Entity<T extends THREE.Object3D> extends GameObject<T> {
  protected targetPosition = new THREE.Vector3();
  protected targetPositionEnd = this.targetPosition.clone();
  protected lookAtTarget = new THREE.Vector3();
  protected lookAtTargetEnd: Vector3 | null = null;
  protected rotation = new THREE.Euler();
  protected rotationEnd: THREE.Euler = this.rotation.clone();
  protected spherical = new THREE.Spherical();
  protected sphericalEnd: THREE.Spherical = this.spherical.clone();
  protected orbiting = false;

  protected yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(this.object.up, AXIS_Y);
  protected yAxisUpSpaceInverse = this.yAxisUpSpace.clone().invert();

  protected moveToCallback: ((target: Vector3) => void) | undefined;
  protected moveToErrorCallback: ((error: Error) => void) | undefined;
  protected lookAtCallback: ((target: Vector3) => void) | undefined;
  protected lookAtErrorCallback: ((error: Error) => void) | undefined;

  dampingFactor = 0.05;

  constructor(object: T) {
    super(object);

    this.rotate = this.rotate.bind(this);
    this.rotateTo = this.rotateTo.bind(this);
    this.sphericalRotate = this.sphericalRotate.bind(this);
    this.sphericalRotateTo = this.sphericalRotateTo.bind(this);
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
    // If we were orbiting reset rotations from the object.
    if (this.orbiting) {
      this.rotationEnd.copy(this.object.rotation);
      this.rotation.copy(this.rotationEnd);
    }

    this.orbiting = false;
    this.rotationEnd = new THREE.Euler(xAngle, yAngle, zAngle);

    if (!smooth) {
      this.rotation.copy(this.rotationEnd);
    }
  }

  /**
   * Rotates using spherical coordinates by the specified degrees
   * @param {number} azimuthAngle
   * @param {number} polarAngle
   * @param {number} distance default is 1
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  sphericalRotate(azimuthAngle: number, polarAngle: number, distance = 1, smooth = true): void {
    const sphericalEnd = this.sphericalEnd ?? this.spherical;
    this.sphericalRotateTo(sphericalEnd.theta + azimuthAngle, sphericalEnd.phi + polarAngle, distance, smooth);
  }

  /**
   * Rotates using spherical coordinates to the specified degrees
   * @param {number} azimuthAngle
   * @param {number} polarAngle
   * @param {number} distance default is 1
   * @param {boolean} smooth flag determines whether the motion is smooth or instantaneous. Default is true
   */
  sphericalRotateTo(azimuthAngle: number, polarAngle: number, distance = 1, smooth = true): void {
    const theta = THREE.MathUtils.clamp(azimuthAngle, -Infinity, Infinity);
    const phi = THREE.MathUtils.clamp(polarAngle, 0, Math.PI);

    this.orbiting = true;
    this.sphericalEnd = new THREE.Spherical(distance, phi, theta);

    if (!smooth) {
      this.spherical.copy(this.sphericalEnd);
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
   * @param {Vector3 | Object3D | GameObject} target
   * @param {boolean} smooth
   * @returns {Promise<Vector3>}
   */
  moveTo(target: Vector3 | Object3D | GameObject, smooth = true): Promise<Vector3> {
    this.targetPositionEnd = GameObject.extractPosition(target);

    return new Promise<Vector3>((resolve, reject) => {
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
   * @param {Vector3 | Object3D | GameObject} target
   * @param {boolean} smooth
   * @returns {Promise<Vector3>}
   */
  lookAt(target: Vector3 | Object3D | GameObject, smooth = true): Promise<Vector3> {
    const targetPosition = GameObject.extractPosition(target);
    this.lookAtTargetEnd = targetPosition;

    return new Promise<Vector3>((resolve, reject) => {
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
   * Updates the values for smooth motion
   * @param {number} delta time since last frame
   */
  protected updateMotion = (delta: number): void => {
    const lerpRatio = 1.0 - Math.exp(-this.dampingFactor * delta * FPS_60);

    const lookAtPosition = this.lookAtTargetEnd ?? this.lookAtTarget;
    const deltaTheta = this.sphericalEnd.theta - this.spherical.theta;
    const deltaPhi = this.sphericalEnd.phi - this.spherical.phi;
    const deltaRadius = this.sphericalEnd.radius - this.spherical.radius;
    const deltaTargetPosition = new THREE.Vector3().subVectors(this.targetPositionEnd, this.targetPosition);
    const deltaLookAtTarget = new THREE.Vector3().subVectors(lookAtPosition, this.lookAtTarget);
    const deltaRotation = new THREE.Euler(
      this.rotationEnd.x - this.rotation.x,
      this.rotationEnd.y - this.rotation.y,
      this.rotationEnd.z - this.rotation.z,
    );

    if (approximatelySphericalEqual(this.sphericalEnd, this.spherical)) {
      this.spherical.copy(this.sphericalEnd);
    } else {
      this.spherical.set(
        this.spherical.radius + deltaRadius * lerpRatio,
        this.spherical.phi + deltaPhi * lerpRatio,
        this.spherical.theta + deltaTheta * lerpRatio,
      );
    }

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
    if (this.lookAtTarget.equals(lookAtPosition)) {
      this.lookAtTargetEnd = null;
      this.rotationEnd.copy(this.object.rotation);
      this.rotation.copy(this.rotationEnd);
      if (this.lookAtCallback) {
        this.lookAtCallback(this.lookAtTarget);
        this.lookAtCallback = undefined;
        this.lookAtErrorCallback = undefined;
      }
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

    if (this.orbiting) {
      this.spherical.makeSafe();
      this.object.position
        .setFromSpherical(this.spherical)
        .applyQuaternion(this.yAxisUpSpaceInverse)
        .add(this.targetPosition);
      this.object.lookAt(this.targetPosition);
    } else {
      this.object.rotation.copy(this.rotation);
      this.object.position.copy(this.targetPosition);
    }

    if (this.lookAtTargetEnd) {
      this.object.lookAt(this.lookAtTarget);
    }
  };

  private normalizeRotation = (): void => {
    const sphericalEnd = this.sphericalEnd ? this.sphericalEnd : this.spherical;
    sphericalEnd.theta = sphericalEnd.theta % PI_2;
    if (sphericalEnd.theta < 0) {
      sphericalEnd.theta += PI_2;
    }
    this.spherical.theta += PI_2 * Math.round((sphericalEnd.theta - this.spherical.theta) / PI_2);
  };
}
