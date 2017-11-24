const http = require('http')
const R = require('ramda')
const [port] = process.argv.slice(2)

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

const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

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

const move = () => {
  return MOVE
}

const bomb = () => {
  return BOMB
}

const actionsPerTick = ({numOfTasksPerTick}, players, items) => {
  let retVal = []

  for(let i = 0; i < numOfTasksPerTick; ++i) {
    const m = whatNext()

    switch(m) {
      case moveTypes.MOVE:
        retVal.push(move())
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
  if (!gameInfo) {
    return [NOOP]
  }

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
      res.end(JSON.stringify(playTurn(gameInfo)))
    })
  }
}).listen(port)

console.log('Battlebot listening on port ' + port)