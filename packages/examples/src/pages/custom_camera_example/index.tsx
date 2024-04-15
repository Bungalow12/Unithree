import React, { useEffect } from 'react';
import * as THREE from 'three';
import { PerspectiveCamera } from 'three';
import { CharacterCapsule } from '../../entities';
import Unithree from '@unithree/core/State';
import Input from '@unithree/core/plugin/Input';
import CameraControllerPlugin from '../../plugins/CameraControllerPlugin';

const CustomCameraExample = (): React.ReactElement => {
  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    const width = window.innerWidth - 10;
    const height = window.innerHeight - 20;
    renderer.setSize(width, height);
    Unithree.initialize(renderer);
    const camera = Unithree.getCamera() as PerspectiveCamera;
    camera.position.set(0, 10, 30);

    // Create an instance of the Input Plugin
    const input = new Input(canvas);
    const cameraControllerPlugin = new CameraControllerPlugin();
    Unithree.addPlugins(input);
    Unithree.addPlugins(cameraControllerPlugin);

    const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
    const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
    spotLight.position.set(10, 10, 10);
    const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
    const character = new CharacterCapsule(input);

    const floor = new THREE.GridHelper(1000, 500, 0x0000ff, 0x004400);
    Unithree.instantiateObject(floor);
    Unithree.instantiateObject(character);
    Unithree.instantiateObject(ambientLight);
    Unithree.instantiateObject(spotLight);
    Unithree.instantiateObject(pointLight);

    Unithree.getPluginByTypeName<Input>('Input')?.initialize(renderer.domElement);
    Unithree.start();
  }, []);

  return (
    <div>
      {/* Important to note that you need a tab index and autofocus enabled to accept keyboard input */}
      <canvas id={'main-canvas'} tabIndex={0} autoFocus={true} />
    </div>
  );
};

export default CustomCameraExample;
