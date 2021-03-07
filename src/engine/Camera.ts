import * as THREE from 'three';
import { GameObject } from './GameObject';

export type Camera<T extends THREE.Camera = THREE.Camera> = GameObject<T>;
