"use strict";

var gamePaused = false;

function main() {
  var grid = new Grid(40);
  // ⠠⠵
  grid.setCellAt(2, 0, 1);
  grid.setCellAt(3, 1, 1);
  grid.setCellAt(1, 2, 1);
  grid.setCellAt(2, 2, 1);
  grid.setCellAt(3, 2, 1);

  var lastFrameTime = new Date;
  history.replaceState(null, null, '#|' + grid + '|');
  window.requestAnimationFrame(function frameHandler() {
    var now = new Date;
    if (!gamePaused && now - lastFrameTime >= 250) {
      grid = grid.advanceTick();
      history.replaceState(null, null, '#|' + grid + '|');
      lastFrameTime = now;
    }
    window.requestAnimationFrame(frameHandler);
  });
}

function Grid(width) {
  this.width = width;
  this.height = 4;
  this.cells = new Uint8Array(this.width * this.height);
}

Grid.prototype.setCellAt = function(x, y, value) {
  this.cells[y * this.width + x] = value;
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
  var l = this.width / 2;
  for (var i = 0; i < l; i++) {
    // Unicode Braille patterns are 256 code points going from 0x2800 to 0x28FF.
    // They follow a binary pattern where the bits are, from least significant
    // to most: ⠁⠂⠄⠈⠐⠠⡀⢀
    // So, for example, 147 (10010011) corresponds to ⢓
    var x = i * 2;
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

function mod(a, b) {
  return (a % b + b) % b;
}

main();
