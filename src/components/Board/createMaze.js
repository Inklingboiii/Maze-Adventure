//algorithm used: http://justinparrtech.com/JustinParr-Tech/wp-content/uploads/Creating%20Mazes%20Using%20Cellular%20Automata_v2.pdf

export default function createMaze() {
  let maze = [];
  const numberOfRows = 2;
  const numberOfColumns = 2;
  const branchProbabilty = 5;
  const turnProbability = 10;
  //initialize maze
  for (let row = 0; row < numberOfRows; row++) {
    maze.push([]);
    for (let col = 0; col < numberOfColumns; col++) {
      maze[row].push({
        state: 0, // 0 = disconnected
        connectVector: null, //vector pointing to parent
        inviteVector: null, // vector pointing to cell it invited
        neighbors: [], // array of neighbors that are disconnectd and can be invited
        vectorTable: buildVectorTable(row, col)
      });
    }
  }

  //pick random initial seed
  const initialSeed =
    maze[Math.floor(Math.random() * numberOfRows)][
      Math.floor(Math.random() * numberOfColumns)
    ];
  initialSeed.state = 1;

  while (!checkIfMazeIsComplete()) {
    startNewGeneration();
  }

  function startNewGeneration() {
    //if no seeds exist transform some connected cells into seeds
    if (!checkIfSeedsExist()) {
      transformConnectedCellsIntoSeeds();
    }
    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < numberOfColumns; col++) {
        let cell = maze[row][col];
        if (cell.state === 0) {
          handleDisconnectedCells(cell);
          continue;
        }

        if (cell.state === 1) {
          handleSeeds(cell);
          continue;
        }

        if (cell.state === 2) {
          handleInvites(cell);
          continue;
        }
      }
    }
  }

  function handleDisconnectedCells(cell) {
    //use vectortable to scan neighbors
    for (
      let neighborVector = 0;
      neighborVector < cell.vectorTable.y.length;
      neighborVector++
    ) {
      if (
        cell.vectorTable.y[neighborVector] === null ||
        cell.vectorTable.x[neighborVector] === null
      ) {
        //collision detection
        continue;
      }
      let neighbor =
        maze[cell.vectorTable.y[neighborVector]][
          cell.vectorTable.x[neighborVector]
        ];
      if (typeof neighbor.inviteVector !== 'null' && neighbor.state === 2) {
        //if inverted invite vector from neighbor is equal to vector pointing to neighbor, that means the invite vector is pointing to the cell
        if ((neighbor.inviteVector + 2) % 4 === neighborVector) {
          //transform cell into seed and register neighbor as parent
          cell.connectVector = neighborVector;
          cell.state = 1;
        }
      }
    }
  }

  function handleSeeds(cell) {
    //reset neighbors
    cell.neighbors = [];
    //use vectortable to store disconnected nighbors to transform into seeds
    for (
      let neighborVector = 0;
      neighborVector < cell.vectorTable.y.length;
      neighborVector++
    ) {
      if (
        cell.vectorTable.y[neighborVector] === null ||
        cell.vectorTable.x[neighborVector] === null
      ) {
        //collission detection
        continue;
      }
      let neighbor =
        maze[cell.vectorTable.y[neighborVector]][
          cell.vectorTable.x[neighborVector]
        ];
      if (neighbor.state === 0) {
        cell.neighbors.push(neighborVector);
      }
    }
    //make cell disconnected if it doesnt have any disconnected cells to invite
    if (!cell.neighbors.length) {
      cell.state = 3;
      return;
    }
    /*pick random neighbor to invite and add directional persistence 
    by giving it a higher chance to get the opposite of its parentvector as invitevector so it continues in a straight line*/
    //also check if cell has a parent vector, since the seed doesnt have one
    if (
      randomPercentage() < turnProbability &&
      cell.connectVector !== null &&
      cell.neighbors.includes((cell.connectVector + 2) % 4)
    ) {
      cell.inviteVector = (cell.connectVector + 2) % 4;
    } else {
      cell.inviteVector =
        cell.neighbors[Math.floor(Math.random() * cell.neighbors.length)];
    }

    //change cell to invite state
    cell.state = 2;
  }

  function handleInvites(cell) {
    //change neighbor from disconnected to seed
    maze[cell.vectorTable.y[cell.inviteVector]][
      cell.vectorTable.x[cell.inviteVector]
    ].state = 1;
    //randomly either chance to state 3 (connected) or seed again determined by branchingprobabbility
    if (randomPercentage() > branchProbabilty) {
      cell.state = 3; //connected
    } else {
      cell.state = 1;
    }
  }

  function checkIfMazeIsComplete() {
    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < numberOfColumns; col++) {
        if (maze[row][col].state === 0) {
          //if there are disconnected return false, else return true
          return false;
        }
      }
    }
    console.log('maze complete');
    return true;
  }

  function checkIfSeedsExist() {
    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < numberOfColumns; col++) {
        if (maze[row][col].state === 1) {
          return true;
        }
      }
    }
    return false;
  }

  function transformConnectedCellsIntoSeeds() {
    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < numberOfColumns; col++) {
        //filter out non connected cells
        if (maze[row][col].state !== 3) {
          continue;
        }
        let cell = maze[row][col];
        let vectorTable = cell.vectorTable;
        //loop though neighbors to find disconnected cells
        for (
          let neighborVector = 0;
          neighborVector < vectorTable.y.length;
          neighborVector++
        ) {
          //collission detection
          if (
            vectorTable.y[neighborVector] === null ||
            vectorTable.x[neighborVector] === null
          ) {
            continue;
          }
          let neighbor =
            maze[vectorTable.y[neighborVector]][vectorTable.x[neighborVector]];
          //interrupt process if neighbor isnt disconnected
          if (neighbor.state !== 0) {
            continue;
          }
          //transform connected cell into seed depending on branching probability and stop looping though neighbors
          if (randomPercentage() <= branchProbabilty) {
            cell.state = 1;
          } 
          break;
        }
      }
    }
  }

  function buildVectorTable(row, col) {
    //0 = NORTH
    //1 = EAST
    //2 = SOUTH
    //3 = WEST
    let vectorTable = {
      y: [row - 1, row, row + 1, row],
      x: [col, col + 1, col, col - 1],
    };
    //collission detection
    for (
      let neighborVector = 0;
      neighborVector < vectorTable.y.length;
      neighborVector++
    ) {
      if (
        vectorTable.y[neighborVector] < 0 ||
        vectorTable.y[neighborVector] >= numberOfRows
      ) {
        vectorTable.y[neighborVector] = null;
      }

      if (
        vectorTable.x[neighborVector] < 0 ||
        vectorTable.x[neighborVector] >= numberOfColumns
      ) {
        vectorTable.x[neighborVector] = null;
      }
    }
    return vectorTable;
  }

  function randomPercentage() {
    return Math.floor(Math.random() * 100);
  }
  return maze;
}
