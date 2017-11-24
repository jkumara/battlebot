const http = require('http')
const R = require('ramda')
const [port] = process.argv.slice(2)

const playerName = 'Battlebot'

const moveTypes = {
  MOVE: 'move',
  BOMB: 'bomb',
  NOOP: 'noop'
}

let moves = [moveTypes.NOOP, moveTypes.NOOP]

const nextMove = () => {
  const [first, second] = moves.slice(-2)
  return first !== moveTypes.BOMB && second !== moveTypes.BOMB ? moveTypes.BOMB : moveTypes.MOVE
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

  const getSafeDir = ({x, y, z}, {x: x2, y: y2, z: z2}) => {
    const xDir = x - x2
    const yDir = y - y2
    const zDir = z - z2

    console.log('what:', x2, y2, z2)

    if (xDir !== 0) {
      return xDir > 0 ? '-X' : '+X'
    }

    if (yDir !== 0) {
      return yDir > 0 ? '-Y' : '+Y'
    }

    if (zDir !== 0) {
      return zDir > 0 ? '-Z' : '+Z'
    }
  }

  const getBotCoords = R.dissoc('name')
  const getItemCoords = R.dissoc('name')
  const getPlayer = R.find(R.propEq('name', playerName))
  const getTargets = R.reject(R.propEq('name', playerName))

  const player = getPlayer(players)
  const targets = getTargets(players)

  const pos = getBotCoords(player)
  const targetCoords = targets.map(getBotCoords)
  const itemCoords = items.map(getItemCoords)
  const dangerCoords = [].concat(targetCoords, itemCoords)

  console.log('edge', parseInt(edgeLength))

  const isBelowBounds = R.pipe(
    R.values,
    R.tap(x => console.log('lol', x)),
    R.any(R.lt(edgeLength - 1)),
    R.tap(x => console.log('->', x))
  )

  const isAboveBounds = R.pipe(
    R.values,
    R.tap(x => console.log('lol', x)),
    R.any(R.gt(0 + 1)),
    R.tap(x => console.log('->', x))
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

  console.log(neighbours)

  const possibleMoves = R.pipe(
    R.reject(isBelowBounds),
    R.reject(isAboveBounds)
  )(neighbours)

  console.log(possibleMoves)
  const safeMoves = R.difference(possibleMoves, dangerCoords)

  console.log('Safe moves')
  console.log(JSON.stringify(safeMoves))

  const moveToCoord = safeMoves[random(0, safeMoves.length)]
  console.log('move', moveToCoord)
  const dir = getSafeDir(pos, moveToCoord)

  const task = {
    task: 'MOVE',
    direction: dir
  }

  return task
}

const bomb = (edgeLength, blacklistCoordinates = []) => {
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

const actionsPerTick = ({numOfTasksPerTick, edgeLength}, players, items) => {
  let retVal = []

  for(let i = 0; i < numOfTasksPerTick; ++i) {
    const m = whatNext()

    switch(m) {
      case moveTypes.MOVE:
        retVal.push(move(edgeLength, players, items))
        break
      case moveTypes.BOMB:
        retVal.push(bomb(edgeLength))
        break
      case moveTypes.NOOP:
      default:
        retVal.push(NOOP)
    }
  }

  return retVal
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
      res.writeHead(200, {'Content-Type': 'application/json'})

      const task = JSON.stringify(playTurn(gameInfo))
      console.log(task)
      res.end(task)
    })
  }
}).listen(port)

console.log('Battlebot listening on port ' + port)