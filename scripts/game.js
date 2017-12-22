// Asteroid Hunter Game
class GameBoard {
    constructor(){
        this.el = $('#gameboard');
        this.width = this.el.width();
        this.height = this.el.height();
    }
}

class Ship {
    constructor(){
       this.setEl(false);
       this._setProperties(); 
    }

    setEl(playAgain){
        if(playAgain){
            this.el = $('<img />').attr({'src': './images/space-ship.png', 'alt': 'Spaceship.'}).addClass('ship');
            this.el.appendTo(game.gameboard.el);
            this.el.css({'top': (game.gameboard.height / 2) - this.height, 'left': 10 });
            this.isExploding = false;
            this.isInvincible = false;
            this.isGameOver = false;
        }else {
            this.el = $('.ship');
        }
        this.el.on('animationend', () => { this.el.removeClass('invincible-flash'); this.isInvincible = false; });
    }

    _setProperties(){
        this.width = this.el.width();
        this.height = this.el.height();
        this.x = this.el.offset().left;
        this.y = this.el.offset().top;
        this.speed = 300; // 300 px per second
        this.lasersOnScreen = 0;
        this.maxlasersOnScreen = 2;
        this.lasers = [null, null, null];
        this.isExploding = false;
        this.isInvincible = false;
        this.pressed = false;
        this.isGameOver = false;
    }

    move(e){
        if(this.isExploding === true){
            return;
        }
        if(this.pressed === true){
            return;
        }
        let time;
        switch(e.which){
            case 37:
                this.pressed = true;
                time = this._duration(this.el.position().left, this.speed, false);
                this.el.animate({'left': 0}, time);
                break;
            case 38:
                this.pressed = true;
                time = this._duration(this.el.position().top, this.speed, false);
                this.el.animate({'top': 0}, time);
                break;
            case 39:
                this.pressed = true;
                time = this._duration(Math.abs(this.el.position().left - (game.gameboard.width - this.width)), this.speed, false);
                this.el.animate({'left': (game.gameboard.width - this.width)}, time);
                break;
            case 40:
                this.pressed = true;
                time = this._duration(Math.abs(this.el.position().top - (game.gameboard.height - this.height)), this.speed, false);
                this.el.animate({'top': (game.gameboard.height - this.height)}, time);
                break;
            default:
                console.log('Not a direction input.');
        }
         
    }
    
    stopMove(e){
        if(e.which === 37 || e.which === 38 || e.which === 39 || e.which === 40){
            this.el.stop(false, false);
            this.pressed = false;
        }        
    }

    fire(e){
        if(this.isGameOver){
            return;
        }
        if(e.which !== 32){
            return;
        }
        if(this.lasersOnScreen <= this.maxlasersOnScreen){
            this.lasersOnScreen++;
            this.lasers.some((item, i) => {
                if(item === null){
                    this.lasers[i] = new Laser;
                    this.lasers[i].index = i;
                    this.lasers[i].el.appendTo(game.gameboard.el)
                                    .css({'left': this.el.position().left + (this.width + 5), 'top': this.el.position().top + (this.height / 2)});
                    const time = this._duration(Math.abs(this.lasers[i].el.position().left - game.gameboard.width), this.lasers[i].speed, true);
                    this.lasers[i].el.animate({'left': game.gameboard.width}, time, 'linear', () => { this.reload(i); });
                    return true;
                }
            });
        }
    }

    reload(i){
        this.lasersOnScreen--;
        this.lasers[i].el.stop();
        this.lasers[i].el.remove();
        this.lasers[i] = null;       
    }

    explode(lives){
        this.isExploding = true;
        this.el.attr({'src': './images/explosion.gif', 'alt': 'Explosion.'});
        if(lives < 1){
            setTimeout(() => {
                this.isGameOver = true;
                this.el.remove();
            }, 1000);
        }else{
            setTimeout(() => {
                this._regen();
            }, 1000);
        }        
    }

    _regen(){
        this.isExploding = false;
        this.isInvincible = true;
        this.el.addClass('invincible-flash');
        this.el.attr({'src': './images/space-ship.png', 'alt': 'Spaceship.'});
    }

    _duration(distance, speed, isLaser){    
        const dur = (distance / speed) * 1000;
        if(isLaser){
            return dur;
        }else if(dur < 350){
            return 350;
        }else{
            return dur;
        }            
    }
}

class Laser {
    constructor(){
        this.width = 30;
        this.height = 5;
        this.el = $('<div></div>')
                        .addClass('laser')
                        .css({'width': this.width, 'height': this.height});
        this.speed = 600; // 600 px per second
    }
}

class Asteroid {
    constructor() {
        this._setProperties();
        this._setEl();
    }

    _setProperties(){
        this.minSize = 15;
        this.maxSize = 80;
        this.width = this._genRanNum(this.minSize, this.maxSize);
        this.height = this.width * 1.06;
        this.rotationSpeed = this._genRanNum(200, 1500);
        this.hitValue = Math.floor(this.width) * 3;
        this.destroyValue = Math.floor(this.width) * 10;
        this.strength = this._setStrength();
        this.isDestroyed = false;
        this.isExploding = false;
        this.explodeTimeout;
    }

    _setEl(){
        this.el = $('<img />')
            .attr({'src': './images/asteroid.png', 'alt': 'Asteroid.'})
            .addClass('asteroid')
            .css({'width': this.width,
                  'height': this.height,
                  'left': game.gameboard.width, 
                  'top': this._genRanNum(0, (game.gameboard.height - this.height))});
        // This animationend event listener will only fire when the  
        // flash CSS animation has finished running. This has nothing 
        // to do with the jQuery animations running on this element          
        this.el.on('animationend', () => { this.el.removeClass('flash'); }); 
    }

    append(){
        game.gameboard.el.append(this.el);
    }

    moveLeft(){
        this.el.animate({
            'left': 0 - this.width
        }, { duration: this._genRanNum(2000, 5000), easing: 'linear', queue: false, complete: () => { this._regen(); } });
    }

    rotate(){
        this.el.animate({
            rotate: '+=1'
        },{ duration: this.rotationSpeed, queue: false, easing: 'linear', complete: () => { this.rotate(); } });
    }

    pause(){
        this.el.pause();
    }

    resume(){
        this.el.resume();
    }

    damage(isShip){
        this.strength--;
        if(this.strength <= 0 || isShip === true){
            this.isDestroyed = true;
            this._explode();
        }
    }

    _explode(){
        this.isExploding = true;
        this.el.attr({'src': './images/explosion.gif', 'alt': 'Explosion.'});
        this.explodeTimeout = setTimeout(() => {
            this._regen();
        }, 1000);
    }

    _regen(){
        clearTimeout(this.explodeTimeout);
        this.width = this._genRanNum(this.minSize, this.maxSize);
        this.height = this.width * 1.06;
        this.el.removeClass('flash');
        this.el.css({
            'width': this.width,
            'height': this.height,
            'left': game.gameboard.width, 
            'top': this._genRanNum(0, (game.gameboard.height - this.height))
        });
        this.el.stop();
        this.el.attr({'src': './images/asteroid.png', 'alt': 'Asteroid.'});
        this.rotationSpeed = this._genRanNum(200, 1500);
        this.hitValue = Math.floor(this.width) * 3;
        this.destroyValue = Math.floor(this.width) * 10;
        this.strength = this._setStrength();
        this.isDestroyed = false;
        this.isExploding = false;
        this.moveLeft();
        this.rotate();
    }

    _genRanNum(min, max){
        return Math.floor(Math.random() * max) + min; 
    }

    _setStrength(){
        const strengthLevel = (this.maxSize - this.minSize) / 6;
        let strength;
        switch(this.width){
            case this.width <= this.minSize + strengthLevel:
                strength = 3;
                break;
            case this.width <= this.minSize + strengthLevel * 2:
                strength = 4;
                break;
            case this.width <= this.minSize + strengthLevel * 3:
                strength = 5;
                break;
            case this.width <= this.minSize + strengthLevel * 4:
                strength = 6;
                break;
            case this.width <= this.minSize + strengthLevel * 5:
                strength = 7;
                break;
            default:
                strength = 8;
        }
        return strength;
    }

}

class Stats {
    constructor(){
        this.score = 0;
        this.lives = 3;
        this.scoreEl = $('#score');
        this.livesEl = $('#lives');
        this.scoreEl.text(this.score);
        this.livesEl.text(this.lives);
    }

    updateScore(hitPoints, asteroidDestroyed, destroyPoints){
        if(asteroidDestroyed){
            this.totalScore += destroyPoints;
        }
        this.score += hitPoints;
        this.scoreEl.text(this.score);
    }

    updateLives(){
        this.lives--;
        this.livesEl.text(this.lives);
    }

}

class Modal {
    constructor(){
        this.overlay = $('#overlay');
        this.modal = $('#game-over-modal');
        this.scoreOut = $('#final-score');
        this.btnPlayAgain = $('#play-again');
        this.btnClose = $('#close'); 
    }
    display(score, showHighScoreBox){
        this.overlay.show();
        this.modal.show();
        this.scoreOut.text(score);
        if(showHighScoreBox){
            this.highScoreBox.show();
        }
    }
    close(){
        this.overlay.hide();
        this.modal.hide();
    }
    
}

class Game {
    constructor(){
        this.asteroids = [];
        this.numberOfAsteroids = 5;
        this.gameboard = new GameBoard();
        this.ship = new Ship();
        this.stats = new Stats();
        this.modal = new Modal();
        this.ticker = null;
        this.tickerCounter = 0;
        this.isGameOver = true;
        this.playCount = 0;
    }
    init(playAgain){
        if(this.isGameOver === false){
            return;
        }
        if(playAgain || this.playCount > 0){
            clearTimeout(this.ticker);
            this.tickerCounter = 0;
            this.asteroids.forEach((asteroid) => {
                asteroid.el.remove();
            });
            this.asteroids = [];
            this.stats.lives = 3;
            this.stats.livesEl.text(this.stats.lives);
            this.stats.score = 0;
            this.stats.scoreEl.text(this.stats.score);
            this.isGameOver = false;
            this.ship.setEl(true);
        }
        if(this.isGameOver && this.playCount > 0){
            return;
        }else{
            this.playCount++;
            this.isGameOver = false;
        }
        for(let i = 0; i < this.numberOfAsteroids; i++){
            setTimeout(()=>{
                this.asteroids[i] = new Asteroid();
                this.asteroids[i].append();
                this.asteroids[i].moveLeft();
                this.asteroids[i].rotate();
            }, 500 * i);
        }
        this._gameLoop();
    }

    _gameLoop(){

        this.tickerCounter++;
        // Check lasers for collision
        this._laserCollision();
        // Check Ship for collision
        this._shipCollision();

        // Run approximately every 10 seconds
        // -> Game runs at 30 frames per second (approximately)
        // 10 seconds = 10 seconds * 30 frames = 300 frames 
        if(this.tickerCounter % 300 === 0 && this.isGameOver === false){
            this._addAsteroid();
        }           
        this.ticker = setTimeout(() => { this._gameLoop() }, 1000/30); 
    }

    _addAsteroid(){
        const asteroidArrayLength = this.asteroids.length;
        this.asteroids[asteroidArrayLength] = new Asteroid();
        this.asteroids[asteroidArrayLength].append();
        this.asteroids[asteroidArrayLength].moveLeft();
        this.asteroids[asteroidArrayLength].rotate();
    }

    _laserCollision(){
        this.ship.lasers.forEach((laser, i) => {
            if(laser === null){
                return;
            }
            const laserHit = this._hitAsteroid(laser);
            if(laserHit.hit){
                this.asteroids[laserHit.index].damage(false);
                if(this.asteroids[laserHit.index].isDestroyed){
                    //this.asteroids[laserHit.index].explode();
                    this.stats.updateScore(laserHit.points, true, this.asteroids[laserHit.index].destroyValue);
                }else{
                    this.asteroids[laserHit.index].el.removeClass('flash')
                                                     .addClass('flash');
                    this.stats.updateScore(laserHit.points, false);
                }               
                this.ship.reload(i);
            }
        });
    }

    _shipCollision(){
        let shipHit = null;
        if(!this.isGameOver && !this.ship.isExploding && !this.ship.isInvincible){
            shipHit = this._hitAsteroid(this.ship);
        }
        if(shipHit !== null && shipHit.hit === true){
            this.asteroids[shipHit.index].damage(true);
            this.stats.updateScore(shipHit.points, true, this.asteroids[shipHit.index].destroyValue);
            this.stats.updateLives();                                
            this.ship.explode(this.stats.lives);
            if(this.stats.lives < 1){
                this._endGame();
            }                                
        }
    }

    _hitAsteroid(obj){
        obj.x = obj.el.offset().left;
        obj.y = obj.el.offset().top;
        let index = null;
        let points = 0;
        let hit = this.asteroids.some((asteroid, i)=>{
            if(asteroid.isExploding){
                index = i;
                return false;
            }
            asteroid.x = asteroid.el.offset().left;
            asteroid.y = asteroid.el.offset().top;
            index = i;
            points = asteroid.hitValue;
            return !(
                ((asteroid.y + asteroid.height) < (obj.y)) ||
                (asteroid.y > (obj.y + obj.height)) ||
                ((asteroid.x + asteroid.width) < obj.x) ||
                (asteroid.x > (obj.x + obj.width))
            );
        });
        return { hit, index, points};
    }

    _endGame(){
        this.isGameOver = true;
        setTimeout(() => {
            this.modal.display(this.stats.score, false);
        }, 700);
    } 
}

const game = new Game();
const $window = $(window);
const $btnStart = $('#btn-start');

$btnStart.click(function(){ game.init(false); });

$window.on('keydown', function(e){ game.ship.move(e); game.ship.fire(e); });

$window.on('keyup', function(e){ game.ship.stopMove(e); });

game.modal.btnClose.on('click', function(){ game.modal.close(); });

game.modal.btnPlayAgain.on('click', function(){ game.modal.close(); game.init(true); });
