import React, { useEffect, useRef } from 'react';
import { UnithreeState } from 'unithree';
import { RotatingCube } from '../../entities';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const BasicEntityExample = (): React.ReactElement => {
  const sceneLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    UnithreeState.initialize(renderer);

    if (!sceneLoadedRef.current) {
      const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
      const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
      spotLight.position.set(10, 10, 10);
      const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
      const cube = new RotatingCube();
      sceneLoadedRef.current = true;
      UnithreeState.instantiateObject(cube);
      UnithreeState.instantiateObject(ambientLight);
      UnithreeState.instantiateObject(spotLight);
      UnithreeState.instantiateObject(pointLight);
    }

    const camera = UnithreeState.getCamera() as THREE.PerspectiveCamera;
    camera.position.z = 5;

    // Setup Three StdLib Orbit Controls
    new OrbitControls(camera, renderer.domElement);

    UnithreeState.start();
  }, []);

  return (
    <div>
      <canvas id={'main-canvas'} />
    </div>
  );
};

export default BasicEntityExample;
