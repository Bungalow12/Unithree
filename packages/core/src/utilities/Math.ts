import { Spherical, Vector3 } from 'three';

export const EPSILON = 1e-5;
export const PI_2 = Math.PI * 2;
export const PI_HALF = Math.PI / 2;
export const FPS_60 = 1 / 0.016;
export const ORIGIN = Object.freeze(new Vector3(0, 0, 0));
export const AXIS_X = Object.freeze(new Vector3(1, 0, 0));
export const AXIS_Y = Object.freeze(new Vector3(0, 1, 0));
export const AXIS_Z = Object.freeze(new Vector3(0, 0, 1));

/**
 * Determines if a floating point number is close enough to zero
 * @param {number} number
 * @returns {boolean}
 */
export const approximatelyZero = (number: number): boolean => Math.abs(number) < EPSILON;

/**
 * Determines if two floating point numbers are close enough to equal
 * @param a
 * @param b
 * @returns {boolean}
 */
export const approximatelyEqual = (a: number, b: number): boolean => approximatelyZero(a - b);

/**
 * Determines if two Spherical objects are equal
 * @param {Spherical} a
 * @param {Spherical} b
 * @returns {boolean}
 */
export const sphericalEqual = (a: Spherical, b: Spherical): boolean =>
  a.radius === b.radius && a.phi === b.phi && a.theta === b.theta;

/**
 * Determines if two Spherical objects are approximately equal
 * @param {Spherical} a
 * @param {Spherical} b
 * @returns {boolean}
 */
export const approximatelySphericalEqual = (a: Spherical, b: Spherical): boolean =>
  approximatelyEqual(a.radius, b.radius) && approximatelyEqual(a.phi, b.phi) && approximatelyEqual(a.theta, b.theta);

/**
 * Determines if two Vector3 objects are approximately equal
 * @param {Vector3} a
 * @param {Vector3} b
 * @returns {boolean}
 */
export const approximatelyVector3Equal = (a: Vector3, b: Vector3): boolean =>
  approximatelyEqual(a.x, b.x) && approximatelyEqual(a.y, b.y) && approximatelyEqual(a.z, b.z);
