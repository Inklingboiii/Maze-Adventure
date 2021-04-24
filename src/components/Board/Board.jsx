import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { WEBGL } from 'three/examples/jsm/WebGL';
import createMaze from './createMaze';
import './Board.css';
import wallMap from 'url:../../../public/assets/wallMap.jpg';
import wallNormalMap from 'url:../../../public/assets/wallNormalMap.png';

function Board(props) {
  const boardReference = useRef();

  const up = ['KeyW', 'ArrowUp'];
  const down = ['KeyS', 'ArrowDown'];
  const left = ['KeyA', 'ArrowLeft'];
  const right = ['KeyD', 'ArrowRight'];

  let width;
  let height;
  let scene;
  let camera;
  let renderer;
  let loader;
  let controls;
  let speed;

  //initialize variables and data
  useEffect(() => {
    checkIfWebGLIsAvailable();
    width = boardReference.current.clientWidth;
    height = boardReference.current.clientHeight;
    speed = 0.1;
    //scene
    scene = new THREE.Scene();
    //camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    //renderer
    renderer = new THREE.WebGLRenderer({
      canvas: boardReference.current
    });
    renderer.setSize(width, height, false);

    //controls
    controls = new PointerLockControls(camera, boardReference.current);
    //loader
    loader = new THREE.TextureLoader();
    //light
    addLight();

    function addLight() {
      const light = new THREE.DirectionalLight('#fff', 1);
      light.target = camera;
      scene.add(light);
    }

    function checkIfWebGLIsAvailable() {
      if (!WEBGL.isWebGLAvailable()) {
        //show error if webgl not available
        const warning = WEBGL.getWebGLErrorMessage();
        boardReference.appendChild(warning);
      }
    }
  }, []);

  //draw objects and create maze
  function startGame() {
    //create maze
    const mazeHeight = 5;
    const mazeWidth = 2;
    let mazeArray = createMaze();

    //draw maze
    drawMaze();

    //draw floor
    drawFloor();

    //enable controls
    togglePointerControls();

    //render
    requestAnimationFrame(render);

    function drawFloor() {
      const numberOfRows = mazeArray.length;
      const numberOfColumns = mazeArray[0].length;
      const geometry = new THREE.PlaneGeometry(
        numberOfColumns * 2,
        numberOfRows * 2
      );
      const material = new THREE.MeshPhongMaterial({
        color: '#f00',
        side: THREE.DoubleSide
      });
      const floor = new THREE.Mesh(geometry, material);
      floor.rotation.x = Math.PI / 2;
      floor.position.set(numberOfColumns, -(mazeHeight / 2), numberOfRows); //put floor under walls
      scene.add(floor);
    }

    function wallMaterials() {
      const geometry = new THREE.BoxGeometry(mazeWidth, mazeHeight, mazeWidth);

      //repeat textures for material so it doesn't stretch
      const texture = loader.load(wallMap);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(mazeWidth, mazeHeight);

      //normal map
      const normalMap = loader.load(wallNormalMap);
      //don't add texture and map to top and bottom since player wouldn't see it
      let materials = [
        new THREE.MeshBasicMaterial({ map: texture, normalMap: normalMap }),
        new THREE.MeshBasicMaterial({ map: texture, normalMap: normalMap }),
        new THREE.MeshBasicMaterial(),
        new THREE.MeshBasicMaterial(),
        new THREE.MeshBasicMaterial({ map: texture, normalMap: normalMap }),
        new THREE.MeshBasicMaterial({ map: texture, normalMap: normalMap })
      ];
      return [geometry, materials];
    }

    function drawMaze() {
      let mazeVisualization = [];
      //maze materials
      const [geometry, materials] = wallMaterials();
      //draw initial walls around each cube and then remove them later on with parent vector
      for (let row = 0; row < mazeArray.length * 2 + 1; row++) {
        mazeVisualization.push([]);
        for (let col = 0; col < mazeArray[0].length * 2 + 1; col++) {
          //draw wall and add it to array to keep track of it
          const wall = new THREE.Mesh(geometry, materials);
          wall.position.x = col * mazeWidth;
          wall.position.z = row * mazeWidth;
          scene.add(wall);
          mazeVisualization[row].push(wall);
        }
      }

      //loop though walls and remove walls where a  parent vector is pointing to
      for (let row = 1; row < mazeArray.length * 2 + 1; row += 2) {
        for (let col = 1; col < mazeArray[0].length * 2 + 1; col += 2) {
          //remove cube
          scene.remove(mazeVisualization[row][col]);
          mazeVisualization[row][col] = null;
          //make path by erasing the walls at the parent vector
          let cell = mazeArray[(row - 1) / 2][(col - 1) / 2];
          const parentVector = cell.connectVector;
          let vectorTable = cell.vectorTable;
          //check if cube has parent vector
          if (parentVector === null) {
            continue;
          }
          //use math to convert parent cell into parentBlock
          const parentBlockRow = vectorTable.y[parentVector] + (row + 1) / 2;
          const parentBlockColumn = vectorTable.x[parentVector] + (col + 1) / 2;
          let parentBlock =
            mazeVisualization[parentBlockRow][parentBlockColumn];
          scene.remove(parentBlock);
          //cant set parentBlock to null, since that wouldnt work due to references
          mazeVisualization[parentBlockRow][parentBlockColumn] = null;
        }
      }
    }
  }

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

  function handleKeyDown(key) {
    switch (key.nativeEvent.code) {
      case up[0]:
      case up[1]:
        controls.moveForward(speed);
        break;
      case down[0]:
      case down[1]:
        controls.moveForward(-speed); //invert speed to move backwards
        break;
      case left[0]:
      case left[1]:
        controls.moveRight(-speed); //invert speed to move left
        break;
      case right[0]:
      case right[1]:
        controls.moveRight(speed);
        break;
      case 'Space':
        camera.position.y += 0.1;
    }
    camera.updateProjectionMatrix();
  }

  function togglePointerControls() {
    if (controls.isLocked) {
      controls.unlock();
    } else {
      controls.lock();
    }
  }
  return (
    <div className={'boardContainer'}>
      <canvas
        tabIndex={0}
        className={'boardContainer__board'}
        ref={boardReference}
        onKeyDown={handleKeyDown}
      ></canvas>
      <button className={'btn boardContainer__btn--start'} onClick={startGame}>
        Click To Start
      </button>
    </div>
  );
}

export default Board;
