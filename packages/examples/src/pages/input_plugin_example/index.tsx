import React, { useEffect, useRef } from 'react';
import { Input, UnithreeState } from 'unithree';
import * as THREE from 'three';
import { InputSphere } from '../../entities';

const InputPluginExample = (): React.ReactElement => {
  const sceneLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    const width = window.innerWidth - 10;
    const height = window.innerHeight - 20;
    const camera = new THREE.OrthographicCamera(width / -5, width / 5, height / 5, height / -5, 1, 1000);
    renderer.setSize(width, height);
    camera.position.z = 16;
    UnithreeState.initialize(renderer, camera);

    if (!sceneLoadedRef.current) {
      // Create an instance of the Input Plugin
      const input = new Input(canvas);
      UnithreeState.addPlugins(input);

      const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
      const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
      spotLight.position.set(10, 10, 10);
      const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
      const sphere = new InputSphere();
      sceneLoadedRef.current = true;
      UnithreeState.instantiateObject(sphere);
      UnithreeState.instantiateObject(ambientLight);
      UnithreeState.instantiateObject(spotLight);
      UnithreeState.instantiateObject(pointLight);
    }

    UnithreeState.start();
  }, []);

  return (
    <div>
      <canvas id={'main-canvas'} tabIndex={0} autoFocus={true} />
    </div>
  );
};

export default InputPluginExample;
