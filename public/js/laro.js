var socket = io();

const MovingDirection = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

///////////////////////////////////////////////////////////////
class Enemy {
  constructor(x, y, tileSize, velocity, tileMap) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap;

    this.currentMovingDirection = null;
    this.requestedMovingDirection = null;

    document.addEventListener("keydown", this.keydown);

    this.loadImages();

    this.scaredAboutToExpireTimerDefault = 10;
    this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault;
  }

  keydown = (event) => {
    if (player2 != "") socket.emit("update", socket.id, event.keyCode);
  };

  draw(ctx, pacman) {
    this.setImage(ctx, pacman);
    this.move();
  }

  move() {
    if (this.currentMovingDirection !== this.requestedMovingDirection) {
      //useful during start
      if (
        Number.isInteger(this.x / this.tileSize) &&
        Number.isInteger(this.y / this.tileSize)
      ) {
        // check pacman current position is an integer
        if (
          !this.tileMap.didCollide(
            this.x,
            this.y,
            this.requestedMovingDirection
          )
        )
          //if hindi bumangga
          this.currentMovingDirection = this.requestedMovingDirection; // current direction pede maging requested
      }
    }

    if (this.tileMap.didCollide(this.x, this.y, this.currentMovingDirection)) {
      // check kung bumangga
      this.pacmanAnimationTimer = null;
      this.pacmanImageIndex = 1; // pag bumangga sara bibig
      return; // pag bumangga, exit na
    } else if (
      this.currentMovingDirection != null &&
      this.pacmanAnimationTimer == null
    ) {
      // if pacman is moving at maganimate pa lang
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
    }

    switch (this.currentMovingDirection) {
      case MovingDirection.up:
        this.y -= this.velocity;
        this.pacmanRotation = this.Rotation.up;

        break;

      case MovingDirection.down:
        this.y += this.velocity;
        this.pacmanRotation = this.Rotation.down;
        break;

      case MovingDirection.left:
        this.x -= this.velocity;
        this.pacmanRotation = this.Rotation.left;
        break;

      case MovingDirection.right:
        this.x += this.velocity;
        this.pacmanRotation = this.Rotation.right;
        break;
    }
  }

  collideWith(pacman) {
    const size = this.tileSize / 2; // pag nangalahati ng bangga
    if (
      this.x < pacman.x + size &&
      this.x + size > pacman.x &&
      this.y < pacman.y + size &&
      this.y + size > pacman.y
    ) {
      //check tigkalahati ng pacman at kalaban
      return true;
    } else {
      return false;
    }
  }

  setImage(ctx, pacman) {
    if (pacman.powerDotActive) {
      this.setImageWhenPowerDotIsActive(pacman);
    } else {
      this.image = this.normalGhost;
    }
    ctx.drawImage(this.image, this.x, this.y, this.tileSize, this.tileSize);
  }

  setImageWhenPowerDotIsActive(pacman) {
    if (pacman.powerDotAboutToExpire) {
      this.scaredAboutToExpireTimer--;
      if (this.scaredAboutToExpireTimer === 0) {
        this.scaredAboutToExpireTimer = this.scaredAboutToExpireTimerDefault;
        if (this.image === this.scaredGhost) {
          this.image = this.scaredGhost2;
        } else {
          this.image = this.scaredGhost;
        }
      }
    } else {
      this.image = this.scaredGhost;
    }
  }

  loadImages() {
    this.normalGhost = new Image();
    this.normalGhost.src = "../images/ghost.png";

    this.scaredGhost = new Image();
    this.scaredGhost.src = "../images/scaredGhost.png";

    this.scaredGhost2 = new Image();
    this.scaredGhost2.src = "../images/scaredGhost2.png";

    this.image = this.normalGhost;
  }
}

/////////////////////////////////////////////////////////////
class Pacman {
  constructor(x, y, tileSize, velocity, tileMap) {
    this.x = x; //coordinates ni pac
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap; // so that pacman is aware of the map

    this.currentMovingDirection = null;
    this.requestedMovingDirection = null;

    this.pacmanAnimationTimerDefault = 10;
    this.pacmanAnimationTimer = null;

    document.addEventListener("keydown", this.keydown);
    /*document.addEventListener("keydown", function(){ 
            socket.emit("update", event.keycode)       
        
        });*/

    this.pacmanRotation = this.Rotation.right;
    this.wakaSound = new Audio("../sounds/waka.wav");

    this.powerDotSound = new Audio("../sounds/power_Dot.wav");
    this.powerDotActive = false;
    this.powerDotAboutToExpire = false;
    this.timers = [];

    this.eatGhostSound = new Audio("../sounds/eat_ghost.wav");

    this.loadPacmanImages();
  }

  Rotation = { right: 0, down: 1, left: 2, up: 3 };

  keydown = (event) => {
    if (player2 != "") socket.emit("update", socket.id, event.keyCode);
  };

  draw(ctx, enemies) {
    this.move(); // for moving pacman
    this.animate();
    this.eatDot();
    this.eatPowerDot();
    this.eatGhost(enemies);

    const size = this.tileSize / 2;

    ctx.save();
    ctx.translate(this.x + size, this.y + size);
    ctx.rotate((this.pacmanRotation * 90 * Math.PI) / 180);
    ctx.drawImage(
      this.pacmanImages[this.pacmanImageIndex],
      -size,
      -size,
      this.tileSize,
      this.tileSize
    );

    ctx.restore();

    //ctx.drawImage(this.pacmanImages[this.pacmanImageIndex], this.x, this.y, this.tileSize, this.tileSize);
  }

  loadPacmanImages() {
    const pacmanImage1 = new Image();
    pacmanImage1.src = "../images/pac0.png";

    const pacmanImage2 = new Image();
    pacmanImage2.src = "../images/pac1.png";

    const pacmanImage3 = new Image();
    pacmanImage3.src = "../images/pac2.png";

    const pacmanImage4 = new Image();
    pacmanImage4.src = "../images/pac1.png";

    this.pacmanImages = [
      pacmanImage1,
      pacmanImage2,
      pacmanImage3,
      pacmanImage4,
    ];

    this.pacmanImageIndex = 0;
  }

  move() {
    if (this.currentMovingDirection !== this.requestedMovingDirection) {
      //useful during start
      if (
        Number.isInteger(this.x / this.tileSize) &&
        Number.isInteger(this.y / this.tileSize)
      ) {
        // check pacman current position is an integer
        if (
          !this.tileMap.didCollide(
            this.x,
            this.y,
            this.requestedMovingDirection
          )
        )
          //if hindi bumangga
          this.currentMovingDirection = this.requestedMovingDirection; // current direction pede maging requested
      }
    }

    if (this.tileMap.didCollide(this.x, this.y, this.currentMovingDirection)) {
      // check kung bumangga
      this.pacmanAnimationTimer = null;
      this.pacmanImageIndex = 1; // pag bumangga sara bibig
      return; // pag bumangga, exit na
    } else if (
      this.currentMovingDirection != null &&
      this.pacmanAnimationTimer == null
    ) {
      // if pacman is moving at maganimate pa lang
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
    }

    switch (this.currentMovingDirection) {
      case MovingDirection.up:
        this.y -= this.velocity;
        this.pacmanRotation = this.Rotation.up;

        break;

      case MovingDirection.down:
        this.y += this.velocity;
        this.pacmanRotation = this.Rotation.down;
        break;

      case MovingDirection.left:
        this.x -= this.velocity;
        this.pacmanRotation = this.Rotation.left;
        break;

      case MovingDirection.right:
        this.x += this.velocity;
        this.pacmanRotation = this.Rotation.right;
        break;
    }
  }

  animate() {
    if (this.pacmanAnimationTimer == null) {
      return;
    }
    this.pacmanAnimationTimer--;
    if (this.pacmanAnimationTimer == 0) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
      this.pacmanImageIndex++;
      if (this.pacmanImageIndex == this.pacmanImages.length)
        this.pacmanImageIndex = 0;
    }
  }

  eatDot() {
    if (this.tileMap.eatDot(this.x, this.y)) {
      this.wakaSound.play();
    }
  }

  eatPowerDot() {
    if (this.tileMap.eatPowerDot(this.x, this.y)) {
      // pag nakakain ng powerdot tugtug
      this.powerDotSound.play();
      this.powerDotActive = true;
      this.powerDotAboutToExpire = false;
      this.timers.forEach((timer) => clearTimeout(timer)); //clear timers
      this.timers = [];

      let powerDotTimer = setTimeout(() => {
        this.powerDotActive = false;
        this.powerDotAboutToExpire = false;
      }, 1000 * 6); // 6 seconds

      this.timers.push(powerDotTimer);

      let powerDotAboutToExpireTimer = setTimeout(() => {
        this.powerDotAboutToExpire = true;
      }, 1000 * 3); // 3 seconds

      this.timers.push(powerDotAboutToExpireTimer);
    }
  }

  eatGhost(enemies) {
    if (this.powerDotActive) {
      const collideEnemies = enemies.filter((enemy) => enemy.collideWith(this));
      collideEnemies.forEach((enemy) => {
        enemies.splice(enemies.indexOf(enemy), 1); // tanggal ung enemy na tinitignan ni foreach
        this.eatGhostSound.play();
      });
    }
  }

  collideWith(enemies) {
    const size = this.tileSize / 2; // pag nangalahati ng
    if (enemies.length > 0) {
      if (
        this.x < enemies[0].x + size &&
        this.x + size > enemies[0].x &&
        this.y < enemies[0].y + size &&
        this.y + size > enemies[0].y &&
        !pacman.powerDotActive
      ) {
        //check tigkalahati ng pacman at kalaban
        return true;
      } else {
        return false;
      }
    }
  }
}

//////////////////////////////////////////////////////////////////
class TileMap {
  constructor(tileSize) {
    this.tileSize = tileSize;

    this.yellowDot = new Image();
    this.yellowDot.src = "images/yellowDot.png";

    this.pinkDot = new Image();
    this.pinkDot.src = "images/pinkDot.png";

    this.wall = new Image();
    this.wall.src = "images/wall.png";

    this.powerDot = this.pinkDot;
    this.powerDotAnimationTimerDefault = 30;
    this.powerDotAnimationTimer = this.powerDotAnimationTimerDefault;
  }

  //0 - pac
  //1 - dot
  //2 - pader
  //5 - empty space
  //6 - enemy
  //7 - power dot
  map = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 7, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 7, 2],
    [2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2],
    [2, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 7, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  ];

  draw(ctx) {
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map[row].length; column++) {
        let tile = this.map[row][column];
        if (tile === 2) {
          this.drawWall(ctx, column, row, this.tileSize);
        } else if (tile === 1) {
          this.drawDot(ctx, column, row, this.tileSize);
        } else if (tile === 7) {
          this.drawPowerDot(ctx, column, row, this.tileSize);
        } else {
          this.drawBlank(ctx, column, row, this.tileSize);
        }

        //ctx.strokeStyle = "red";
        //ctx.strokeRect(column*this.tileSize, row*this.tileSize, this.tileSize, this.tileSize);
      }
    }
  }

  drawWall(ctx, column, row, size) {
    ctx.drawImage(
      this.wall,
      column * this.tileSize,
      row * this.tileSize,
      size,
      size
    );
  }

  drawBlank(ctx, column, row, size) {
    //ctx.fillStyle = "black";
    ctx.fillRect(column * this.tileSize, row * this.tileSize, size, size);
  }

  drawDot(ctx, column, row, size) {
    ctx.drawImage(
      this.yellowDot,
      column * this.tileSize,
      row * this.tileSize,
      size,
      size
    );
  }

  drawPowerDot(ctx, column, row, size) {
    this.powerDotAnimationTimer--;
    if (this.powerDotAnimationTimer == 0) {
      this.powerDotAnimationTimer = this.powerDotAnimationTimerDefault;
      if (this.powerDot == this.pinkDot) {
        this.powerDot = this.yellowDot;
      } else {
        this.powerDot = this.pinkDot;
      }
    }

    ctx.drawImage(this.powerDot, column * size, row * size, size, size);
  }

  getPacman(velocity) {
    var p = {};
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map[row].length; column++) {
        let tile = this.map[row][column];
        if (tile === 0) {
          this.map[row][column] = 0;
          p = new Pacman( // new pacman object with new properties
            column * this.tileSize, //coordinates ni pac
            row * this.tileSize, // coordinates ni pac
            this.tileSize, // size
            velocity, //velocity ni pac
            this // tilemap object
          );
          //socket.emit('update', pacman);
          return p;
        }
      }
    }
  }

  getEnemies(velocity) {
    var e = {};
    const enemies = [];
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map[row].length; column++) {
        const tile = this.map[row][column];
        if (tile === 6) {
          this.map[row][column] = 0;

          enemies.push(
            new Enemy(
              column * this.tileSize,
              row * this.tileSize,
              this.tileSize,
              velocity,
              this
            )
          );
        }
      }
    }
    //socket.emit('update', enemies);
    return enemies;
  }

  setCanvasSize(canvas) {
    canvas.width = this.map[0].length * this.tileSize;
    canvas.height = this.map.length * this.tileSize;
  }

  didCollide(x, y, direction) {
    if (direction == null) {
      return;
    }

    if (
      Number.isInteger(x / this.tileSize) &&
      Number.isInteger(y / this.tileSize)
    ) {
      let column = 0;
      let row = 0;
      let nextColumn = 0;
      let nextRow = 0;

      switch (
        direction //check ung katabi na element
      ) {
        case MovingDirection.right:
          nextColumn = x + this.tileSize; // next pader
          column = nextColumn / this.tileSize; // to get position inside array
          row = y / this.tileSize;
          break;

        case MovingDirection.left:
          nextColumn = x - this.tileSize; // pader
          column = nextColumn / this.tileSize; // to get position inside array
          row = y / this.tileSize;
          break;

        case MovingDirection.up:
          nextRow = y - this.tileSize; // pader
          row = nextRow / this.tileSize; // to get position inside array
          column = x / this.tileSize;
          break;

        case MovingDirection.down:
          nextRow = y + this.tileSize; // pader
          row = nextRow / this.tileSize; // to get position inside array
          column = x / this.tileSize;
          break;
      }
      const tile = this.map[row][column];
      if (tile === 2) {
        return true;
      }
    }
    return false;
  }

  didWin() {
    //console.log(this.dotsLeft());
    return this.dotsLeft() === 0; // pag ubos na dots
  }

  dotsLeft() {
    return this.map.flat().filter((tile) => tile === 1).length; //flat makes 1 big array; check kung ilan dots natira
  }

  eatDot(x, y) {
    const row = y / this.tileSize;
    const column = x / this.tileSize;
    if (Number.isInteger(row) && Number.isInteger(column)) {
      if (this.map[row][column] === 1) {
        this.map[row][column] = 5;
        return true;
      }
    }
    return false;
  }

  eatPowerDot(x, y) {
    const row = y / this.tileSize;
    const column = x / this.tileSize;
    if (Number.isInteger(row) && Number.isInteger(column)) {
      // if nasa loob ng tile only
      const tile = this.map[row][column];
      if (tile === 7) {
        this.map[row][column] = 5;
        return true;
      }
    }
    return false; //di nakain
  }
}

let canvas = document.getElementById("canvas");

const tileSize = 32;
const velocity = 2;

const ctx = canvas.getContext("2d");

const tileMap = new TileMap(tileSize);
const pacman = tileMap.getPacman(velocity); //object
const enemies = tileMap.getEnemies(velocity);

//console.log(pacman.x); //288 orig

let gameOver = false;
let gameWin = false;
const gameOverSound = new Audio("../sounds/gameOver.wav");
const gameWinSound = new Audio("../sounds/gameWin.wav");
let tapos = false;

function gameLoop() {
  tileMap.draw(ctx);
  console.log(player1, "player1");
  console.log(player2, "player2");

  if (pacman.collideWith(enemies) && !pacman.powerDotActive) {
    tapos = true;
    gameOver = true;
    checkGameOver();
    if (gameOver) {
      gameOverSound.play();
      socket.emit("gameover");
      socket.on("ovah", function () {
        enemies[0].velocity = 0;
        pacman.velocity = 0;
      });
      console.log("tapos na");
    }
  }

  drawGameEnd(); //776
  //console.log(pacman.x); //288 orig
  /*if(a !== 288)
    {
        pacman.x = a;
        pacman.y = b;
    }
   */
  pacman.draw(ctx, enemies); // dito nakapaloob ung this.move sa pacman.js
  enemies.forEach((enemy) => enemy.draw(ctx, pacman)); // may reference kay pacman para maccess ung powerdot functions
  //console.log(pacman.collideWith(enemies));
  console.log(pacman.x, "pac");
  //console.log(enemies[0].x, "ghost");
  console.log(tapos);
  checkGameWin();
}

function checkGameWin() {
  if (!gameWin) {
    gameWin = tileMap.didWin();
    if (gameWin) {
      gameWinSound.play();
      console.log("win!");
    }
  }
}

function checkGameOver() {
  if (!gameOver) {
    gameOver = isGameOver();
    if (gameOver) {
      gameOverSound.play();
    }
  }
}

function isGameOver() {
  if (enemies.length > 0) {
    if (pacman.x == enemies[0].x && !pacman.powerDotActive) tapos = true;
  }

  if (
    enemies.some(
      (enemy) => !pacman.powerDotActive && enemy.collideWith(pacman)
    ) &&
    tapos
  )
    return true;
}

function drawGameEnd() {
  if (gameOver || gameWin) {
    let text = "You Win!";
    if (gameOver) {
      text = "Game Over!!!";
    }

    document.getElementById("status").innerHTML = text;
  }
}

tileMap.setCanvasSize(canvas);

let player1 = "";
let player2 = "";
console.log("hi");
socket.on("id", (players) => {
  //console.log(id);

  player1 = players[0];

  if (players.length > 1) player2 = players[1];

  console.log(player1);
  console.log(player2);
});

socket.on("render", function (key) {
  //console.log("render");
  console.log(key);

  if (key == 38) {
    if (pacman.currentMovingDirection == MovingDirection.down)
      pacman.currentMovingDirection = MovingDirection.up;
    pacman.requestedMovingDirection = MovingDirection.up;

    console.log(this.requestedMovingDirection);
  }
  //down
  if (key == 40) {
    if (pacman.currentMovingDirection == MovingDirection.up)
      pacman.currentMovingDirection = MovingDirection.down;
    pacman.requestedMovingDirection = MovingDirection.down;
  }
  //left
  if (key == 37) {
    if (pacman.currentMovingDirection == MovingDirection.right)
      pacman.currentMovingDirection = MovingDirection.left;
    pacman.requestedMovingDirection = MovingDirection.left;
  }
  //right
  if (key == 39) {
    if (pacman.currentMovingDirection == MovingDirection.left)
      pacman.currentMovingDirection = MovingDirection.right;
    pacman.requestedMovingDirection = MovingDirection.right;
  }

  if (enemies.length > 0) {
    if (key == 87) {
      if (enemies[0].currentMovingDirection == MovingDirection.down)
        enemies[0].currentMovingDirection = MovingDirection.up;
      enemies[0].requestedMovingDirection = MovingDirection.up;
    }
    //down
    if (key == 83) {
      if (enemies[0].currentMovingDirection == MovingDirection.up)
        enemies[0].currentMovingDirection = MovingDirection.down;
      enemies[0].requestedMovingDirection = MovingDirection.down;
    }
    //left
    if (key == 65) {
      if (enemies[0].currentMovingDirection == MovingDirection.right)
        enemies[0].currentMovingDirection = MovingDirection.left;
      enemies[0].requestedMovingDirection = MovingDirection.left;
    }
    //right
    if (key == 68) {
      if (enemies[0].currentMovingDirection == MovingDirection.left)
        enemies[0].currentMovingDirection = MovingDirection.right;
      enemies[0].requestedMovingDirection = MovingDirection.right;
    }
  }
  gameLoop();
  //setInterval(function(){gameLoop()}, 1000 / 75);
});

//setInterval(function(){gameLoop(a,b)}, 1000 / 75);

//*
