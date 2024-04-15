import React, { useEffect } from 'react';
import * as THREE from 'three';
import { InputSphere } from '../../entities';
import Unithree from '@unithree/core/State';
import Input from '@unithree/core/plugin/Input';

const InputPluginExample = (): React.ReactElement => {
  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    const width = window.innerWidth - 10;
    const height = window.innerHeight - 20;
    const camera = new THREE.OrthographicCamera(width / -5, width / 5, height / 5, height / -5, 1, 1000);
    renderer.setSize(width, height);
    camera.position.z = 16;
    Unithree.initialize(renderer, camera);

    // Create an instance of the Input Plugin
    const input = new Input(canvas);
    Unithree.addPlugins(input);

    const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
    const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
    spotLight.position.set(10, 10, 10);
    const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
    const sphere = new InputSphere();
    Unithree.instantiateObject(sphere);
    Unithree.instantiateObject(ambientLight);
    Unithree.instantiateObject(spotLight);
    Unithree.instantiateObject(pointLight);

    Unithree.start();
  }, []);

  return (
    <div>
      {/* Important to note that you need a tab index and autofocus enabled to accept keyboard input */}
      <canvas id={'main-canvas'} tabIndex={0} autoFocus={true} />
    </div>
  );
};

export default InputPluginExample;
