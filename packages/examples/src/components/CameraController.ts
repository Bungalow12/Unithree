import { Camera } from 'three';
import { Component } from 'unithree';

export interface CameraController<T extends Camera> extends Component {
  camera: T;
}
