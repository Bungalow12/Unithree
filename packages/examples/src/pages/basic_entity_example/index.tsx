import React, { useEffect, useRef } from 'react';
import { UnithreeState } from 'unithree';
import { RotatingCube } from '../../entities';
import * as THREE from 'three';

const BasicEntityExample = (): React.ReactElement => {
  let renderer: THREE.WebGLRenderer;
  const cubeRef = useRef<RotatingCube>();

  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.append(UnithreeState.initialize(renderer));
    UnithreeState.initialize(renderer);

    if (!cubeRef.current) {
      /*
      <ambientLight intensity={Math.PI / 2} />
    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
    <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
       */
      const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
      const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
      spotLight.position.set(10, 10, 10);
      const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
      const cube = new RotatingCube();
      cubeRef.current = cube;
      UnithreeState.instantiateObject(cube);
      UnithreeState.instantiateObject(ambientLight);
      UnithreeState.instantiateObject(spotLight);
      UnithreeState.instantiateObject(pointLight);
    }

    UnithreeState.getCamera().position.z = 5;

    UnithreeState.start();
  }, []);

  return (
    <div>
      <canvas id={'main-canvas'} />
    </div>
  );
};

export default BasicEntityExample;
