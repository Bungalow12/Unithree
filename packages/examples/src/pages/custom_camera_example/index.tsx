import React, { useEffect, useRef } from 'react';
import { Input, UnithreeState } from 'unithree';
import * as THREE from 'three';
import { CharacterCapsule } from '../../entities';

const CustomCameraExample = (): React.ReactElement => {
  const sceneLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    const width = window.innerWidth - 10;
    const height = window.innerHeight - 20;
    renderer.setSize(width, height);
    UnithreeState.initialize(renderer);
    const camera = UnithreeState.getCamera();
    camera.position.set(0, 10, 30);

    if (!sceneLoadedRef.current) {
      // Create an instance of the Input Plugin
      const input = new Input(canvas);
      UnithreeState.addPlugins(input);

      const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
      const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
      spotLight.position.set(10, 10, 10);
      const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
      const character = new CharacterCapsule();
      // const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
      // const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x004400 });
      // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      // floor.rotation.x = -Math.PI / 2;
      // floor.receiveShadow = true;
      const floor = new THREE.GridHelper(1000, 500, 0x0000ff, 0x004400);
      sceneLoadedRef.current = true;
      UnithreeState.instantiateObject(floor);
      UnithreeState.instantiateObject(character);
      UnithreeState.instantiateObject(ambientLight);
      UnithreeState.instantiateObject(spotLight);
      UnithreeState.instantiateObject(pointLight);
    }

    UnithreeState.start();
  }, []);

  return (
    <div>
      {/* Important to note that you need a tab index and autofocus enabled to accept keyboard input */}
      <canvas id={'main-canvas'} tabIndex={0} autoFocus={true} />
    </div>
  );
};

export default CustomCameraExample;
