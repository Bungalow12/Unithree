import {
  approximatelyEqual,
  approximatelySphericalEqual,
  approximatelyVector3Equal,
  approximatelyZero,
  sphericalEqual,
} from './Math';
import { Spherical, Vector3 } from 'three';

describe('Math Utilities', () => {
  test('ApproximatelyZero', () => {
    expect(approximatelyZero(1e-6)).toBe(true);
    expect(approximatelyZero(1e-4)).toBe(false);
  });

  test('ApproximatelyEqual', () => {
    expect(approximatelyEqual(5, 5 + 1e-6)).toBe(true);
    expect(approximatelyEqual(5, 5 + 1e-4)).toBe(false);
  });

  test('SphericalEqual', () => {
    const a = new Spherical(5, 5, 5);
    const b = new Spherical(5, 5, 5);
    const c = new Spherical(6, 5, 5);
    expect(sphericalEqual(a, b)).toBe(true);
    expect(sphericalEqual(a, c)).toBe(false);
  });

  test('ApproximatelySphericalEqual', () => {
    const a = new Spherical(5, 5, 5);
    const b = new Spherical(5 + 1e-6, 5, 5);
    const c = new Spherical(5 + 1e-4, 5, 5);
    expect(approximatelySphericalEqual(a, b)).toBe(true);
    expect(approximatelySphericalEqual(a, c)).toBe(false);
  });

  test('ApproximatelyVectorEqual', () => {
    const a = new Vector3(5, 5, 5);
    const b = new Vector3(5 + 1e-6, 5, 5);
    const c = new Vector3(5 + 1e-4, 5, 5);
    expect(approximatelyVector3Equal(a, b)).toBe(true);
    expect(approximatelyVector3Equal(a, c)).toBe(false);
  });
});
