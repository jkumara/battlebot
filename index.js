const http = require('http')
const [port] = process.argv.slice(2)

const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

if (!port) {
  console.error('You didn\'t pass a port :(')
  process.exit(1);
}

const NOOP = {task: 'NOOP'}

const playTurn = ({gameInfo, players, items}) => {
  if (!gameInfo) {
    return [NOOP]
  }

  return Array(gameInfo.numOfTasksPerTick).fill(NOOP)
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