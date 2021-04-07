import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WEBGL from './webgl';
import createMaze from './createMaze';
import './Board.css';

function Board(props) {
  const boardReference = useRef(null);

  const up = ['KeyW', 'ArrowUp'];
  const down = ['KeyS', 'ArrowDown'];
  const left = ['KeyA', 'ArrowLeft'];
  const right = ['KeyD', 'ArrowRight'];
  let handleKeyDown;

  useEffect(() => {
    if (!WEBGL.isWebGLAvailable()) {
      //show error if webgl not available
      const warning = WEBGL.getWebGLErrorMessage();
      boardReference.appendChild(warning);
    }

    let width = boardReference.current.clientWidth;
    let height = boardReference.current.clientHeight;
    //scene
    const scene = new THREE.Scene();
    //camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    //objects

    //cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: '#0ff',
      flatShading: true
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    //light
    const light = new THREE.PointLight('#fff', 1);
    light.position.set(0, 2, 4);
    scene.add(light);

    //renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: boardReference.current
    });
    renderer.setSize(width, height, false)
    renderer.render(scene, camera);

    //rotate cube
    let timeOfLastMovement;
    requestAnimationFrame(animate);

    //draw maze
    console.log(createMaze());

    function animate(timeStamp) {
      //resize canvas content (not canvas element since that resizes automatically) and camera if canvas size was changed
      width = boardReference.current.clientWidth;
      height = boardReference.current.clientHeight;
      if (
        boardReference.current.width !== width ||
        boardReference.current.height !== height
      ) {
        renderer.setSize(width, height, false); //sets size of canvas
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      if (typeof timeOfLastMovement === 'undefined') {
        timeOfLastMovement = timeStamp;
      }
      if (timeOfLastMovement + 1 < timeStamp) {
        timeOfLastMovement = timeStamp;
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;
        renderer.render(scene, camera);
      }

      renderer.render(scene, camera);

      requestAnimationFrame(animate);
    }

    handleKeyDown = (key) => {
      switch (key.nativeEvent.code) {
        case up[0]:
        case up[1]:
          camera.position.z -= 0.1;
          break;
        case down[0]:
        case down[1]:
          camera.position.z += 0.1;
          break;
        case left[0]:
        case left[1]:
          camera.position.x -= 0.1;
          break;
        case right[0]:
        case right[1]:
          camera.position.x += 0.1;
          break;
      }
    };
  }, []);

  return (
    <canvas
      tabIndex={0}
      className={'board'}
      ref={boardReference}
      onKeyDown={(key) => handleKeyDown(key)}
    ></canvas>
  );
}

export default Board;
