import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import WEBGL from "./webgl";
import "./Board.css";

function Board(props) {
    const boardReference = useRef(null);
    const up = ["KeyW", "ArrowUp"];
    const down = ["KeyS", "ArrowDown"];
    const left = ["KeyA", "ArrowLeft"];
    const right = ["KeyD", "ArrowRight"];
    let handleKeyDown;

    useEffect(() => {
      if(!WEBGL.isWebGLAvailable()) { //show error if webgl not available
        const warning = WEBGL.getWebGLErrorMessage();
	      boardReference.appendChild( warning );
      }
        const width = window.innerWidth / 2;
        const height = window.innerHeight / 2;
        //scene
        const scene = new THREE.Scene();
        //camera
        const camera = new THREE.PerspectiveCamera(
          45,
          width / height ,
          0.1,
          500
          );
          camera.position.set(0, 0, 150);
        //renderer
        const renderer = new THREE.WebGLRenderer( {canvas: boardReference.current} );
        renderer.setSize(width, height );
          //objects
        const points = [
          new THREE.Vector3(-10, -10, 10),
          new THREE.Vector3(10, -10, 10),
          new THREE.Vector3(10, 10, -10),
          new THREE.Vector3(20, 10, -10),
          new THREE.Vector3(0, 20, -20),
          new THREE.Vector3(-20, 10, -10),
          new THREE.Vector3(-10, 10, -10),
          new THREE.Vector3(-10, -10, 10),

          new THREE.Vector3(100, -10, 0),
          new THREE.Vector3(120, -10, 0),
          new THREE.Vector3(120, 10, 0),
          new THREE.Vector3(130, 10, 0),
          new THREE.Vector3(110, 20, 0),
          new THREE.Vector3(90, 10, 0),
          new THREE.Vector3(100, 10, 0),
          new THREE.Vector3(100, -10, 0)
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineDashedMaterial({ color: '#0ff' });
        const line = new THREE.Line(geometry, material);
        //add object
        scene.add(line);

        //rotate cube
        let timeOfLastMovement;
        requestAnimationFrame( animate );
        

        function animate(timeSTamp) {
          if(typeof timeOfLastMovement === 'undefined') {
            timeOfLastMovement = timeSTamp;
          }
          if(timeOfLastMovement + 10 < timeSTamp) {
            timeOfLastMovement = timeSTamp;
            renderer.render(scene, camera);
          }
          requestAnimationFrame( animate )
        }


         handleKeyDown = (key) => {
          switch(key.nativeEvent.code) {
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
              camera.position.x += 0.1
              break;
          }
        }
    },
    []);

    return (
        <canvas 
        tabIndex={0}
        className={"board"}
        ref={boardReference}
        onKeyDown={(key) => handleKeyDown(key)}
        >

        </canvas>
    )
}

export default Board