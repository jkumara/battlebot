const express = require('express')
const app = express()
const [port] = process.argv.slice(2)

if (!port) {
  console.error('You didn\'t pass a port :(')
  process.exit(1);
}

const NOOP = {task: 'NOOP'}

const playTurn = ({gameInfo, players, items}) => {
  return Array(gameInfo.numOfTasksPerTick).fill(NOOP)
}

app.use(express.json())

app.post('/', (req, res) => {
  const gameInfo = req.body
  res.json(playTurn(gameInfo))
})

app.listen(port, '0.0.0.0', () => console.log('Battlebot listening on port ' + port))