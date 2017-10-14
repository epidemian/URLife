"use strict";

var grid;
var lastFrameTime;
var gamePaused = false;

var rules = {
  birth: [3],
  survival: [2, 3]
};

function main() {
  startLife(location.hash);

  window.requestAnimationFrame(function frameHandler() {
    var now = new Date;
    if (!gamePaused && now - lastFrameTime >= 250) {
      console.log('' + grid);
      grid = grid.advanceTick();
      history.replaceState(null, null, '#[' + grid + ']');
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
  };
}

function searchForStillLife() {
  var stills = [];
  for (var n = 1; n < 1 << 24; n++) {
    var
      c1 = n >> 16 & 0xff,
      c2 = n >> 8 & 0xff,
      c3 = n >> 0 & 0xff;
    var s = String.fromCharCode(c1 + 0x2800) +
      String.fromCharCode(c2 + 0x2800) +
      String.fromCharCode(c3 + 0x2800) + '⠀';
    var g = Grid.fromString(s);
    g = g.advanceTick();
    var s2 = g.toString();
    if (s === s2) {
      stills.push(s2);
    }
  }
  document.write('Still life:<br>' + stills.join('<br>'))
}

function searchForBlinkers() {
  var blinkers = [];
  var known = new Set;
  for (var n = 1; n < 1 << 24; n++) {
    var
      c1 = n >> 16 & 0xff,
      c2 = n >> 8 & 0xff,
      c3 = n >> 0 & 0xff;
    var s = String.fromCharCode(c1 + 0x2800) +
      String.fromCharCode(c2 + 0x2800) +
      String.fromCharCode(c3 + 0x2800) + '⠀⠀';
    if (known.has(s)) continue;
    var g = Grid.fromString(s);
    var ss = [s];
    for (var i = 0; i < 8; i++) {
      g = g.advanceTick();
      var s2 = g.toString();
      if (s === s2) {
        if (i === 0) break; // Still life.
        blinkers.push(s2);
        for (var j = 0; j < ss.length; j++) {
          known.add(ss[j]);
        }
        break;
      }
      ss.push(s2);
    }
  }
  document.write('Blinkers:<br>' + blinkers.join('<br>'))
}

function searchForGliders() {
  for (var n = 1; n < 256; n++) {
   for (var m = 0; m < 256; m++) {
     var s = String.fromCharCode(n + 0x2800) + String.fromCharCode(m + 0x2800);
     var g = Grid.fromString(s + '⠀⠀⠀⠀');
     for (var i = 0; i < 32; i++) {
       g = g.advanceTick();
       var s2 = g.toString();
       if (!s2.startsWith(s) && s2.includes(s)) {
         console.log('seems like glider: ' + s + '  |' + g + '|')
         break;
       }
     }
   }
  }
}

function startLife(hash) {
  var hashMatch = decodeURIComponent(hash).match(/[⠀-⣿|]+/);
  var gridStr = hashMatch ? hashMatch[0] : '⠠⠵⠀⠀⠀⠀⠀⠀⠀⠀|⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀';
  grid = Grid.fromString(gridStr);
  lastFrameTime = new Date;
  history.replaceState(null, null, '#[' + grid + ']');
}

function Grid(width, height) {
  this.width = width;
  this.height = height;
  this.cells = new Uint8Array(width * height);
}

Grid.prototype.setCellAt = function(x, y, value) {
  this.cells[y * this.width + x] = !!value;
};

Grid.prototype.cellAt = function(x, y) {
  return this.cells[y * this.width + x];
};

Grid.prototype.advanceTick = function() {
  var nextGrid = new Grid(this.width, this.height);

  for (var x = 0; x < this.width; x++) {
    for (var y = 0; y < this.height; y++) {
      var n = this.neighbours(x, y);
      var alive = this.cellAt(x, y)
        ? rules.survival.indexOf(n) >= 0
        : rules.birth.indexOf(n) >= 0;
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
  var lines = [];
  for (var y = 0; y < this.height; y += 4) {
    var line = ''
    for (var x = 0; x < this.width; x += 2) {
      // Unicode Braille patterns are 256 code points from 0x2800 to 0x28FF.
      // They follow a binary pattern where the bits are, from least significant
      // to most: ⠁⠂⠄⠈⠐⠠⡀⢀
      // So, for example, 147 (10010011) corresponds to ⢓
      var n = 0
        | this.cellAt(x, y) << 0
        | this.cellAt(x, y + 1) << 1
        | this.cellAt(x, y + 2) << 2
        | this.cellAt(x + 1, y) << 3
        | this.cellAt(x + 1, y + 1) << 4
        | this.cellAt(x + 1, y + 2) << 5
        | this.cellAt(x, y + 3) << 6
        | this.cellAt(x + 1, y + 3) << 7;
      line += String.fromCharCode(0x2800 + n);
    }
    lines.push(line)
  }
  return lines.join('|');
};

Grid.fromString = function(str) {
  var lines = str.split('|')
  var width = Math.max(...lines.map(l => l.length)) * 2
  var height = lines.length * 4
  var grid = new Grid(width, height);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var y = i * 4
    for (var j = 0; j < line.length; j++) {
      var b = line.charCodeAt(j) - 0x2800;
      var x = j * 2;
      grid.setCellAt(x, y, b & 1);
      grid.setCellAt(x, y + 1, b & 2);
      grid.setCellAt(x, y + 2, b & 4);
      grid.setCellAt(x + 1, y, b & 8);
      grid.setCellAt(x + 1, y + 1, b & 16);
      grid.setCellAt(x + 1, y + 2, b & 32);
      grid.setCellAt(x, y + 3, b & 64);
      grid.setCellAt(x + 1, y + 3, b & 128);
    }
  }

  return grid;
};

function mod(a, b) {
  return (a % b + b) % b;
}

main();
