import * as THREE from "three";

export type SupportedCamera =
  | THREE.PerspectiveCamera
  | THREE.OrthographicCamera
  | THREE.StereoCamera;

export type Object3D = THREE.Object3D;
export type Scene = THREE.Scene;
