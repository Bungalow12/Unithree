import React, { useEffect, useRef } from 'react';
import { RotatingCube } from '../../entities';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { ClickablePlugin } from '../../plugins';
import { ColorChangeClickableComponent } from '../../components';
import Unithree from '@unithree/core';

const ClickComponentExample = (): React.ReactElement => {
  const sceneLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    Unithree.initialize(renderer);

    // Add the Clickable Plugin to the processor
    Unithree.addPlugins(new ClickablePlugin());

    const ambientLight = new THREE.AmbientLight('white', Math.PI / 2);
    const spotLight = new THREE.SpotLight('white', Math.PI, 0, 0.15, 1, 0);
    spotLight.position.set(10, 10, 10);
    const pointLight = new THREE.PointLight('white', Math.PI, 0, 0);
    const cube = new RotatingCube();

    // Add a Color Change Clickable Component to change the color on click
    const clickableComponent = new ColorChangeClickableComponent(cube);
    cube.addComponents(clickableComponent);

    sceneLoadedRef.current = true;
    Unithree.instantiateObject(cube);
    Unithree.instantiateObject(ambientLight);
    Unithree.instantiateObject(spotLight);
    Unithree.instantiateObject(pointLight);

    const camera = Unithree.getCamera() as THREE.PerspectiveCamera;
    camera.position.z = 5;

    // Setup Three StdLib Orbit Controls
    new OrbitControls(camera, renderer.domElement);

    Unithree.start();
  }, []);

  return (
    <div>
      <canvas id={'main-canvas'} />
    </div>
  );
};

export default ClickComponentExample;
