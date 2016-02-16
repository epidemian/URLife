"use strict";

var grid;
var lastFrameTime;
var gamePaused = false;

function main() {
  startLife(location.hash);

  window.requestAnimationFrame(function frameHandler() {
    var now = new Date;
    if (!gamePaused && now - lastFrameTime >= 250) {
      grid = grid.advanceTick();
      history.replaceState(null, null, '#|' + grid + '|');
      lastFrameTime = now;
    }
    window.requestAnimationFrame(frameHandler);
  });

  window.onblur = function pauseGame() {
    gamePaused = true;
    window.history.replaceState(null, null, location.hash + ' (paused)')
  };

  window.onfocus = function unpauseGame() {
    gamePaused = false;
  };

  window.onhashchange = function(e) {
    startLife(e.newURL.split('#')[1]);
  }
}

function startLife(hash) {
  var hashMatch = decodeURIComponent(hash).match(/[⠀-⣿]+/);
  var gridStr = hashMatch ? hashMatch[0] : '⠠⠵⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀';
  grid = Grid.fromString(gridStr);
  lastFrameTime = new Date;
  history.replaceState(null, null, '#|' + grid + '|');
}

function Grid(width) {
  this.width = width;
  this.height = 4;
  this.cells = new Uint8Array(this.width * this.height);
}

Grid.prototype.setCellAt = function(x, y, value) {
  this.cells[y * this.width + x] = !!value;
};

Grid.prototype.cellAt = function(x, y) {
  return this.cells[y * this.width + x];
};

Grid.prototype.advanceTick = function() {
  var nextGrid = new Grid(this.width);

  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      var n = this.neighbours(x, y);
      var alive = this.cellAt(x, y) ? n === 2 || n === 3 : n === 3;
      nextGrid.setCellAt(x, y, alive);
    }
  }

  return nextGrid;
};

Grid.prototype.neighbours = function (x, y) {
  var x1 = mod(x - 1, this.width) ;
  var x2 = mod(x + 1, this.width);
  var y1 = mod(y - 1, this.height);
  var y2 = mod(y + 1, this.height);
  return this.cellAt(x1, y1) +
    this.cellAt(x1, y) +
    this.cellAt(x1, y2) +
    this.cellAt(x, y1) +
    this.cellAt(x, y2) +
    this.cellAt(x2, y1) +
    this.cellAt(x2, y) +
    this.cellAt(x2, y2);
};

Grid.prototype.toString = function() {
  var str = '';
  for (var x = 0; x < this.width; x += 2) {
    // Unicode Braille patterns are 256 code points going from 0x2800 to 0x28FF.
    // They follow a binary pattern where the bits are, from least significant
    // to most: ⠁⠂⠄⠈⠐⠠⡀⢀
    // So, for example, 147 (10010011) corresponds to ⢓
    var n = 0
      | this.cellAt(x, 0) << 0
      | this.cellAt(x, 1) << 1
      | this.cellAt(x, 2) << 2
      | this.cellAt(x + 1, 0) << 3
      | this.cellAt(x + 1, 1) << 4
      | this.cellAt(x + 1, 2) << 5
      | this.cellAt(x, 3) << 6
      | this.cellAt(x + 1, 3) << 7;
    str += String.fromCharCode(0x2800 + n);
  }
  return str;
};

Grid.fromString = function(str) {
  var grid = new Grid(str.length * 2);

  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i) - 0x2800;
    var x = i * 2;
    grid.setCellAt(x, 0, b & 1);
    grid.setCellAt(x, 1, b & 2);
    grid.setCellAt(x, 2, b & 4);
    grid.setCellAt(x + 1, 0, b & 8);
    grid.setCellAt(x + 1, 1, b & 16);
    grid.setCellAt(x + 1, 2, b & 32);
    grid.setCellAt(x, 3, b & 64);
    grid.setCellAt(x + 1, 3, b & 128);
  }

  return grid;
};

function mod(a, b) {
  return (a % b + b) % b;
}

main();
