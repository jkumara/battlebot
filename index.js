const http = require('http')
const R = require('ramda')
const [port] = process.argv.slice(2)

const playerName = 'Battlebot'

const moveTypes = {
  MOVE: 'move',
  BOMB: 'bomb',
  NOOP: 'noop'
}

let moves = [moveTypes.MOVE, moveTypes.MOVE]

const nextMove = () => {
  const [first, second] = moves.slice(-2)
  return first === moveTypes.MOVE || second === moveTypes.MOVE ? moveTypes.BOMB : moveTypes.MOVE
}

const random = (min, max) => Math.floor(Math.random() * (max - min) + min)

const coordinateEquals = ({x1, y1, z1}) => ({x2, y2, z2}) => x1 === x2 && y1 === y2 && z1 === z2

if (!port) {
  console.error('You didn\'t pass a port :(')
  process.exit(1);
}

const NOOP = {task: 'NOOP'}

const whatNext = () => {
  const next = nextMove()
  moves.push(next)
  return next
}

const move = (edgeLength, players, items) => {
  const getBotCoords = R.dissoc('name')
  const getItemCoords = R.dissoc('name')
  const getPlayer = R.find(R.propEq('name', playerName))
  const getTargets = R.reject(R.propEq('name', playerName))

  const player = getPlayer(players)
  const targets = getTargets(players)

  const pos = getBotCoords(player)
  const targetCoords = targets.map(getBotCoords)
  const itemCoords = items.map(getItemCoords)

  const coordEquals = ({x, y, z}, {x2, y2, z2}) => x === x2 && y === y2 && z === z2

  const isOutOfBounds = R.pipe(
    R.values,
    R.any(R.gt(edgeLength)),
    R.any(R.lt(0))
  )

  console.log('My loc')
  console.log(JSON.stringify(pos))

  const neighbours = []

  for (let axis of ['x', 'y', 'z']) {
    for (let dir of [1, -1]) {
      neighbours.push({
        ...pos,
        [axis]: pos[axis] + dir
      })
    }
  }

  const possibleMoves = R.pipe(
    R.reject(isOutOfBounds)
  )(neighbours)

  console.log('Possible moves')
  console.log(JSON.stringify(possibleMoves))

  const task = {
    task: 'MOVE',
    direction: "-X"
  }

  console.log(task)

  return task
}

const bomb = (edgeLength, blacklistCoordinates = []) => {
  console.log('blacklist')
  console.log(blacklistCoordinates)
  let retVal
  do {
    retVal = {
      task: 'BOMB',
      x: random(0, edgeLength - 1),
      y: random(0, edgeLength - 1),
      z: random(0, edgeLength - 1)
    }
  } while(R.any(coordinateEquals(retVal))(blacklistCoordinates))
  return retVal
}

const actionsInTicks = numOfTasksPerTick => {
  let moveActions = 0
  let bombActions = 0
  let noopActions = 0

  for(let i = 0; i < numOfTasksPerTick; ++i) {
    const next = whatNext()
    console.log('next: ' + next)
    if (next === 'bomb') {
      ++bombActions
    } else if (next === 'move') {
      ++moveActions
    } else {
      ++noopActions
    }
  }

  return {
    moveActions,
    bombActions,
    noopActions
  }
}

const callNTimes = (n, fn) => {
  let retVal = []
  for (let i = 0; i < n; ++i) {
    retVal.push(fn())
  }
  return retVal
}

const actionsPerTick = ({numOfTasksPerTick, edgeLength}, players, items) => {
  const actions = actionsInTicks(numOfTasksPerTick)
  const actionMoves = callNTimes(actions.moveActions, () => move(edgeLength, players, items))
  const actionBombs = callNTimes(actions.bombActions, () => bomb(edgeLength))
  const actionNoops = callNTimes(actions.noopActions, () => ({task: 'NOOP'}))
  return R.concat(
    actionMoves,
    actionBombs,
    actionNoops
  )
}

const playTurn = ({gameInfo, players, items}) => {
  return actionsPerTick(gameInfo, players, items)
}


http.createServer((req, res) => {
  if (req.method === 'POST') {
    let jsonString = '';

    req.on('data', (data) => {
      jsonString += data
    })

    req.on('end', () => {
      const gameInfo = JSON.parse(jsonString)

      console.log('we got next tick info', gameInfo)
      res.writeHead(200, {'Content-Type': 'application/json'})

      const task = JSON.stringify(playTurn(gameInfo))
      console.log(task)
      res.end(task)
    })
  }
}).listen(port)

console.log('Battlebot listening on port ' + port)