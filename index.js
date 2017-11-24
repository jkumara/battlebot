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
  return first === moveTypes.MOVE || second === moveTypes.MOVE ? moveTypes.BOMB : moveTypes.MOVE
}

const random = (min, max) => Math.floor(Math.random() * (max - min) + min)

if (!port) {
  console.error('You didn\'t pass a port :(')
  process.exit(1);
}

const NOOP = {task: 'NOOP'}
const MOVE = {task: 'MOVE'}
const BOMB = {task: 'BOMB'}

const whatNext = () => {
  const next = nextMove()
  moves.push(next)
  return next
}

const move = (edgeLength, players, items) => {
  const getBotCoords = R.dissoc('name')
  const getPlayer = R.find(R.propEq('name', playerName))
  const getTargets = R.reject(R.propEq('name', playerName))

  const player = getPlayer(players)
  const targets = getTargets(players)

  const curLocation = getBotCoords(player)
  const targetCoords = targets.map(getBotCoords)

  console.log('My loc')
  console.log(JSON.stringify(curLocation))

  console.log('Enemy locs')
  console.log(JSON.stringify(targetCoords))

  const task = {
    ...MOVE,
    direction: "-X"
  }

  console.log(task)

  return task
}

const bomb = () => {
  return NOOP // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! change
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
        retVal.push(bomb())
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

      console.log('we got next tick info', gameInfo)
      res.writeHead(200, {'Content-Type': 'application/json'})

      const task = JSON.stringify(playTurn(gameInfo))
      console.log(task)
      res.end(task)
    })
  }
}).listen(port)

console.log('Battlebot listening on port ' + port)