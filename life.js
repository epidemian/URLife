'use strict'

let grid
let rules
let lastFrameTime
let gamePaused = false

const main = () => {
  startLife()

  window.requestAnimationFrame(frameHandler)
  window.onblur = pauseGame
  window.onfocus = unpauseGame
  window.onhashchange = startLife
}

const frameHandler = () => {
  const now = new Date()
  if (!gamePaused && now - lastFrameTime >= 100) {
    grid = grid.advanceTick()
    drawGame()
    lastFrameTime = now
  }
  window.requestAnimationFrame(frameHandler)
}

const startLife = () => {
  const gameStr = decodeURIComponent(window.location.hash)
  grid = parseGrid(gameStr) || parseGrid('⠠⠵⠀⠀⠀⠀|⠀⠀⠀⠀⠀⠀|⠀⠀⠀⠀⠀⠀')
  rules = parseRules(gameStr) || parseRules('B3/S23')
  lastFrameTime = new Date()
  drawGame()
}

const parseGrid = gameStr => {
  const match = gameStr.match(/[⠀-⣿|]+/)
  return match && Grid.fromString(match[0])
}

const parseRules = gameStr => {
  const match = gameStr.match(/B(\d+)\/S(\d+)/)
  if (!match) return

  // Note: in general Array#sort() sucks (e.g., try [1, 2, 10]), but here it's
  // safe to use it because the numbers are single digit ;-)
  const parseNumbers = s => s.split('').map(n => parseInt(n, 10)).sort()
  return {
    birth: parseNumbers(match[1]),
    survival: parseNumbers(match[2])
  }
}

const unpauseGame = () => {
  gamePaused = false
}

const pauseGame = () => {
  gamePaused = true
  window.history.replaceState(null, null, window.location.hash + ' (paused)')
}

const drawGame = () => {
  let rulesStr = `B${rules.birth.join('')}/S${rules.survival.join('')}`
  const gameStr = `${rulesStr === 'B3/S23' ? '' : rulesStr}[${grid}]`

  console.log(gameStr)
  window.history.replaceState(null, null, `#${gameStr}`)
}

class Grid {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.cells = new Uint8Array(width * height)
  }

  cellAt(x, y) {
    return this.cells[y * this.width + x]
  }

  setCellAt(x, y, value) {
    this.cells[y * this.width + x] = !!value
  }

  advanceTick() {
    const nextGrid = new Grid(this.width, this.height)

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const n = this.neighbourCount(x, y)
        const alive = this.cellAt(x, y)
          ? rules.survival.indexOf(n) >= 0
          : rules.birth.indexOf(n) >= 0
        nextGrid.setCellAt(x, y, alive)
      }
    }

    return nextGrid
  }

  neighbourCount(x, y) {
    const x1 = mod(x - 1, this.width)
    const x2 = mod(x + 1, this.width)
    const y1 = mod(y - 1, this.height)
    const y2 = mod(y + 1, this.height)
    return this.cellAt(x1, y1) +
      this.cellAt(x1, y) +
      this.cellAt(x1, y2) +
      this.cellAt(x, y1) +
      this.cellAt(x, y2) +
      this.cellAt(x2, y1) +
      this.cellAt(x2, y) +
      this.cellAt(x2, y2)
  }

  toString() {
    const lines = []
    for (let y = 0; y < this.height; y += 4) {
      let line = ''
      for (let x = 0; x < this.width; x += 2) {
        // Unicode Braille patterns are 256 code points from 0x2800 to 0x28FF.
        // They follow a binary pattern where the bits are, from least
        // significant to most: ⠁⠂⠄⠈⠐⠠⡀⢀
        // So, for example, 147 (10010011) corresponds to ⢓
        const n = 0 |
          this.cellAt(x, y) << 0 |
          this.cellAt(x, y + 1) << 1 |
          this.cellAt(x, y + 2) << 2 |
          this.cellAt(x + 1, y) << 3 |
          this.cellAt(x + 1, y + 1) << 4 |
          this.cellAt(x + 1, y + 2) << 5 |
          this.cellAt(x, y + 3) << 6 |
          this.cellAt(x + 1, y + 3) << 7
        line += String.fromCharCode(0x2800 + n)
      }
      lines.push(line)
    }
    return lines.join('|')
  }

  static fromString(str) {
    const lines = str.split('|')
    const width = Math.max(...lines.map(l => l.length)) * 2
    const height = lines.length * 4
    const grid = new Grid(width, height)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const y = i * 4
      for (let j = 0; j < line.length; j++) {
        const b = line.charCodeAt(j) - 0x2800
        const x = j * 2
        grid.setCellAt(x, y, b & 1)
        grid.setCellAt(x, y + 1, b & 2)
        grid.setCellAt(x, y + 2, b & 4)
        grid.setCellAt(x + 1, y, b & 8)
        grid.setCellAt(x + 1, y + 1, b & 16)
        grid.setCellAt(x + 1, y + 2, b & 32)
        grid.setCellAt(x, y + 3, b & 64)
        grid.setCellAt(x + 1, y + 3, b & 128)
      }
    }

    return grid
  }
}

const mod = (a, b) => (a % b + b) % b

main()
