export default function createMaze() {
    let maze = []
    const numberOfRows = 25;
    const numberOfColumns = 25;
    //initialize maze
    for(let row = 0; row < numberOfRows; row++) {
        maze.push([]);
        for(let col = 0; col < numberOfColumns; col++) {
            maze[row].push(
                {
                    state: 0, // 0 = disconnected
                    connectVector: null, //vector pointing to parent
                    inviteVector: null, // vector pointing to cell it invited
                    neighbors: null // array of neighbors that are disconnectd and can be invited
                }
                );
        }
    }

    //pick random initial seed
    const initialSeed = maze[Math.floor(Math.random() * numberOfRows)][Math.floor(Math.random() * numberOfColumns)];
    initialSeed.state = 1;
    function checkIfMazeIsComplete() {

    }

    return maze;

}