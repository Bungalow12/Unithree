import React, { useEffect } from 'react';
import { RotatingCube } from '../../entities';
import { OrbitControls } from 'three-stdlib';
import Unithree from '@unithree/core/State';
import { AmbientLight, PerspectiveCamera, PointLight, SpotLight, WebGLRenderer } from 'three';

const BasicEntityExample = (): React.ReactElement => {
  useEffect(() => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const renderer = new WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    Unithree.initialize(renderer);

    const ambientLight = new AmbientLight('white', Math.PI / 2);
    const spotLight = new SpotLight('white', Math.PI, 0, 0.15, 1, 0);
    spotLight.position.set(10, 10, 10);
    const pointLight = new PointLight('white', Math.PI, 0, 0);
    const cube = new RotatingCube();
    Unithree.instantiateObject(cube);
    Unithree.instantiateObject(ambientLight);
    Unithree.instantiateObject(spotLight);
    Unithree.instantiateObject(pointLight);

    const camera = Unithree.getCamera() as PerspectiveCamera;
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

export default BasicEntityExample;
