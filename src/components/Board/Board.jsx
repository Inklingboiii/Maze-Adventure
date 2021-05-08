import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { WEBGL } from 'three/examples/jsm/WebGL';
import Stats from 'stats.js';
import createMaze from './createMaze';
import './Board.css';
import wallMap from 'url:../../../public/assets/wallMap.jpg';
import wallNormalMap from 'url:../../../public/assets/wallNormalMap.png';
import ProgressBar from './ProgressBar/ProgressBar';

function Board() {
	const boardReference = useRef();

	const up = ['KeyW', 'ArrowUp'];
	const down = ['KeyS', 'ArrowDown'];
	const left = ['KeyA', 'ArrowLeft'];
	const right = ['KeyD', 'ArrowRight'];
	const [isLoading, isLoadingSetter] = useState(false);
	const [loadingProgress, loadingProgressSetter] = useState(0);
	let width;
	let height;
	let scene;
	let camera;
	let renderer;
	let loader;
	let controls;
	let player;
	let mazeHeight;
	let mazeWidth;
	let wallsBoundingBox = [];
	let emptyFields = [];
	let canvasNeedsResizing = true;
	let canvasNeedsRerendering = true; //set gameloop variables to true for intial render
	let stats;

	//initialize variables and data
	useEffect(() => {
		checkIfWebGLIsAvailable();
		width = boardReference.current.clientWidth;
		height = boardReference.current.clientHeight;
		//scene
		scene = new THREE.Scene();
		//camera
		camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 75);
		//renderer
		renderer = new THREE.WebGLRenderer({
			canvas: boardReference.current,
			powerPreference: 'high-performance'
		});
		renderer.setSize(width, height, false);

		//controls
		controls = new PointerLockControls(camera, boardReference.current);
		document.addEventListener('keydown', handleKeyDown);
		//loader
		loader = new THREE.TextureLoader();
		//light
		addLight();

		//stats
		stats = new Stats();
		stats.showPanel(0);
		document.body.appendChild(stats.dom);

		function addLight() {
			const light = new THREE.PointLight('#fff', 1);
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
		console.time('start game');
		isLoadingSetter(true);
		//create maze
		mazeHeight = 5;
		mazeWidth = 2;
		let mazeArray = createMaze();
		loadingProgressSetter(() => 30);
		//draw maze
		drawMaze();

		//draw floor
		drawFloor();
		loadingProgressSetter(() => 60);
		//add player
		createPlayer();
		scene.add(player);
		player.updateMatrix();

		//enable controls
		togglePointerControls();
		//rerender when player moves
		addRenderingEvents();
		console.timeEnd('start game');
		//initial render
		loadingProgressSetter(() => 100);
		isLoadingSetter(false);
		requestAnimationFrame(render);

		function drawFloor() {
			const width = (mazeArray.length * 2 + 1) * mazeWidth; //number of rows times width of rows
			const height = (mazeArray[0].length * 2 + 1) * mazeWidth; // number of columns times width of columns
			const geometry = new THREE.PlaneGeometry(
				height,
				width
			);
			const material = new THREE.MeshPhongMaterial({
				color: '#f00',
				side: THREE.DoubleSide
			});
			const floor = new THREE.Mesh(geometry, material);
			floor.matrixAutoUpdate = false;
			floor.rotation.x = Math.PI / 2;
			floor.position.set(width / 2, -(mazeHeight / 2), height / 2); //put floor in the middle of the walls in al axisses
			scene.add(floor);
			floor.updateMatrix();
		}

		function wallMaterials() {
			const geometry = new THREE.BoxBufferGeometry(
				mazeWidth,
				mazeHeight,
				mazeWidth
			);
			let materials = [];
			for(let i = 0; i < 6; i++) {
				materials.push(new THREE.MeshPhongMaterial());
			}
			[wallMap, wallNormalMap].map((map, index) => {
				const texture = loader.load(map, () => {
					canvasNeedsRerendering = true;
				});
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(mazeWidth, mazeHeight);
				if(index === 0) {
					materials.map((material, index) => {
						if(index !== 2 || index !== 3) {
							material.map = texture;
						}
					});
					// compare index so texture doesnt get added to bottom and top
				} else {
					materials.map((material) => {
						if(index !== 2 || index !== 3) {
							material.normalMap = texture;
						}
					});
				}
			});
			return [geometry, materials];
		}

		function drawMaze() {
			let mazeVisualization = [];
			//maze materials
			const [geometry, materials] = wallMaterials();
			const wallInstances = new THREE.InstancedMesh(geometry, materials, (mazeArray.length * 2 + 1) * (mazeArray[0].length * 2 + 1));
      
			//draw initial walls around each cube and then remove them later on with parent vector
			for (let row = 0; row < mazeArray.length * 2 + 1; row++) {
				mazeVisualization.push([]);
				for (let col = 0; col < mazeArray[0].length * 2 + 1; col++) {
					const index = (row * (mazeArray.length * 2 + 1)) + col;
					//draw wall and add it to array to keep track of it
					const positionalObject = new THREE.Object3D();
					positionalObject.geometry = geometry;
					positionalObject.position.set(col * mazeWidth, positionalObject.position.y, row * mazeWidth);
					positionalObject.updateMatrix();
					const wallBoundingBox = new THREE.Box3();
					wallBoundingBox.setFromObject(positionalObject);

					wallInstances.setMatrixAt(index, positionalObject.matrix);
					mazeVisualization[row].push(wallBoundingBox);
				}
			}

			//loop though walls and remove walls where a  parent vector is pointing to
			for (let row = 1; row < mazeArray.length * 2 + 1; row += 2) {
				for (let col = 1; col < mazeArray[0].length * 2 + 1; col += 2) {
					let index = (row * (mazeArray.length * 2 + 1)) + col;
					let positionalObject = new THREE.Object3D();
					positionalObject.geometry = geometry;
					//remove cube
					positionalObject.position.set(col * mazeWidth, -10, row * mazeWidth);
					positionalObject.updateMatrix();
					wallInstances.setMatrixAt(index, positionalObject.matrix);
					mazeVisualization[row][col] = null;
					//add removed wall to array of empty fields for player spawning
					emptyFields.push(positionalObject);
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
					index = (parentBlockRow * (mazeArray.length * 2 + 1)) + parentBlockColumn;
					positionalObject.x = parentBlockColumn * mazeWidth;
					positionalObject.z = parentBlockRow * mazeWidth;
					wallInstances.setMatrixAt(index, positionalObject.matrix);
					mazeVisualization[parentBlockRow][parentBlockColumn] = null;
					emptyFields.push(positionalObject);
				}
			}
			wallInstances.instanceMatrix.needsUpdate = true;
			wallInstances.material.needsUpdate = true;
			scene.add(wallInstances);
			console.log('maze visualization', mazeVisualization);

			wallsBoundingBox = mazeVisualization.flat().filter((wallBoundingBox) => wallBoundingBox !== null);
		}

		function createPlayer() {
			const playerHeight = mazeHeight;
			const playerWidth = mazeWidth / 3;

			const geometry = new THREE.BoxGeometry(
				playerWidth,
				playerHeight,
				playerWidth
			);
			const material = new THREE.MeshPhongMaterial({ color: '#0f0' });
			player = new THREE.Mesh(geometry, material);
			let randomPosition = emptyFields[Math.floor(Math.random() * emptyFields.length)].position;
			player.position.set(randomPosition.x, player.position.y, randomPosition.z);
			camera.position.copy(player.position);
			player.speed = 0.1;
			player.matrixAutoUpdate = false;
		}

		function addRenderingEvents() {
			window.addEventListener('resize', () => {
				canvasNeedsResizing = true;
				canvasNeedsRerendering = true;
			});
			controls.addEventListener('change', () => {
				canvasNeedsRerendering = true;
			});
		}
	}

	function render() {
		stats.begin();
		if (canvasNeedsResizing) {
			//resize canvas content (not canvas element since that resizes automatically) and camera if canvas size was changed
			width = boardReference.current.clientWidth;
			height = boardReference.current.clientHeight;
			if (
				boardReference.current.width !== width ||
        boardReference.current.height !== height
			) {
				renderer.setSize(width, height, false); //sets size of canvas
				camera.aspect = width / height;
			}
			canvasNeedsResizing = false;
		}
		//update camera
		camera.updateProjectionMatrix();

		if(canvasNeedsRerendering) {
			renderer.render(scene, camera);
			canvasNeedsRerendering = false;
		}
		requestAnimationFrame(render);
		stats.end();
	}

	function handleKeyDown(key) {
		switch (key.code) {
		case up[0]:
		case up[1]:
			movePlayer(controls.moveForward, player.speed);
			break;
		case down[0]:
		case down[1]:
			movePlayer(controls.moveForward, -player.speed);
			break;
		case left[0]:
		case left[1]: 
			movePlayer(controls.moveRight, -player.speed);
			break;
		case right[0]:
		case right[1]:
			movePlayer(controls.moveRight, player.speed);
			break;
		case 'Space':
			camera.position.y += 0.1;
		}
		canvasNeedsRerendering = true;
	}

	function playerColliding() {
		player.updateMatrix();
		let playerBoundingBox = new THREE.Box3().setFromObject(player);

		for(let i = 0; i < wallsBoundingBox.length; i++) {
			if(playerBoundingBox.intersectsBox(wallsBoundingBox[i])) {
				return true;
			}
		}
		return false;
	}

	function movePlayer(movementFunction, playerSpeed) {
		let cameraPositionCopy = camera.position.clone();
		movementFunction(playerSpeed);
		//update player position after moving camera
		player.position.copy(camera.position);
		//reverse camera movement if it collides with a wall
		if(playerColliding()) {
			camera.position.copy(cameraPositionCopy);
			player.position.copy(cameraPositionCopy);
		}
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
				className={'boardContainer__board'}
				ref={boardReference}
			></canvas>
			<button className={'btn boardContainer__btn--start'} onClick={startGame}>
        Click To Start
			</button>
			<ProgressBar progress={loadingProgress} isLoading={isLoading}/>
		</div>
	);
}

export default Board;
