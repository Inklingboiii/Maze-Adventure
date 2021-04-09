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
    checkIfWebGLIsAvailable();

    let width = boardReference.current.clientWidth;
    let height = boardReference.current.clientHeight;
    //scene
    const scene = new THREE.Scene();
    //camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    //objects

    //light
    const light = new THREE.PointLight('#fff', 1);
    light.position.set(0, 100, 4);
    scene.add(light);

    //draw maze
    let mazeData =  createMaze()
    let mazeArray = mazeData.maze;
    //draw floor
    drawFloor(scene, mazeData.numberOfRows, mazeArray.numberOfColumns);
    let mazeVisualization = [];
    for(let row = 0; row < mazeArray.length; row++) {
      mazeVisualization.push([]);
      for(let col = 0; col < mazeArray[0].length; col++) {
        mazeVisualization[row].push([]);
        let cellVisualization =  mazeVisualization[row][col];
        let cell = mazeArray[row][col];
        let vectorTable =cell.vectorTable;
        let parentVector = cell.connectVector;
        //draw 3 cubes around each cell except where the parentvector points to
        const geometry = new THREE.BoxGeometry(1, 5, 1);
        let material;
        if(cell.state === 0) {
          material = new THREE.MeshBasicMaterial({color: '#ccc'});
        }
        if(cell.state === 1) {
          material = new THREE.MeshBasicMaterial({color: '#0f0'});
        }
        if(cell.state === 2) {
          material = new THREE.MeshBasicMaterial({color: '#00f'});
        }
        if(cell.state === 3) {
          material = new THREE.MeshBasicMaterial({color: '#0ff'});
        }
        //draw cubes around cellVisualization
        for(let neighborVector = 0; neighborVector < vectorTable.y.length; neighborVector++) {
          let wall = new THREE.Mesh(geometry, material);
          //times two to emphasize margin
          if(neighborVector === parentVector) {
            continue;
          }
          cellVisualization.push(wall);
          wall.position.x =  vectorTable.x[neighborVector] * 2;
          wall.position.z = vectorTable.y[neighborVector] * 2;
          scene.add(wall);
        }
      }
    }

     //renderer
     const renderer = new THREE.WebGLRenderer({
      canvas: boardReference.current
    });
    renderer.setSize(width, height, false)
    renderer.render(scene, camera);

    requestAnimationFrame(render);


    function render() {
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

      renderer.render(scene, camera);

      requestAnimationFrame(render);
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
        case 'Space':
          camera.position.y += 1;
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

function checkIfWebGLIsAvailable() {
  if (!WEBGL.isWebGLAvailable()) {
    //show error if webgl not available
    const warning = WEBGL.getWebGLErrorMessage();
    boardReference.appendChild(warning);
  }
}

function drawFloor(scene, numberOfRows, numberOfColumns) {
  const geometry = new THREE.PlaneGeometry(10, 10);
  const material = new THREE.MeshBasicMaterial({color: '#f00', side: THREE.DoubleSide});
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.set(90, 0, 0)
  scene.add(floor);
  console.log(floor)
}

export default Board;
