var game;
window.game = game;


window.onload = function(){
	var w = 1024;
	var h = w / (window.innerWidth / window.innerHeight);

	game = new Phaser.Game(w, h, Phaser.AUTO, 'gameContainer');

	var starbattle = new StarBattle();
	starbattle.scaleRatio = window.innerWidth > w ? window.innerWidth / w : 1;
	starbattle.initialAlienMoveTimer = 0;

	// adding game state
    game.state.add("StarBattle", starbattle);
     
    // starting game state
    game.state.start("StarBattle");
};
var StarBattle = function(){};

StarBattle.prototype = {
	
	speedChange: 400,
	heroDimensions: {w: 136, h: 84},
	bulletDimensions: {w: 15, h: 18},
     
     // when the state preloads
     preload: function(){
     	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
 		game.load.image("stars", "assets/background.png");
    	game.load.spritesheet("spaceship", "assets/spaceship2.png", this.heroDimensions.w, this.heroDimensions.h);
    	game.load.spritesheet("bullet", "assets/bullet1.png", this.bulletDimensions.w, this.bulletDimensions.h);
    	game.load.audio("laser", "assets/BulletFire.ogg");
    	game.load.image("alien1", "assets/AlienShip1.png");
    	game.load.image("particle", "assets/particle.png");
    	game.load.spritesheet("explosions", "assets/explosions.png", 100, 100);
    	game.load.audio("Explosion", "assets/Explosion.ogg");
     },

     create: function() {
		this.graphics = game.add.graphics(100, 100);
		game.physics.startSystem(Phaser.Physics.ARCADE);
	
		
		// Background
		 var background = game.add.tileSprite(0, 0, game.width, game.height, "stars");
		//background.scale.setTo(2.5, 2.5);
		
		// Hero
		this.hero = game.add.sprite((game.width/2) - 26, game.height - 120, "spaceship");
		this.hero.scale.setTo(1 / this.scaleRatio, 1 / this.scaleRatio);
		game.physics.arcade.enable(this.hero);
		this.hero.body.collideWorldBounds = true;
		this.hero.animations.add("left", [1], 10, true);
		this.hero.animations.add("right", [2], 10, true);

		// Alien1
		this.aliens = game.add.group();
		this.ExplosionSound = game.add.audio("Explosion");
		this.aliens.enableBody = true;
		this.aliens.collideWorldBounds = true;
		// If positive aliens are oving to the right, if negative aliens are moving to the left
		this.aliens.moveDirection = 10;
		alienPattern = ["alien1", "alien1", "alien1", "alien1", "alien1"];
		//game.physics.arcade.enable(this.alien);
		//this.alien.body.collideWorldBounds = true;
		//this.alien.body.setSize(61, 145, 40, 5);
		for (var i = 0; i < alienPattern.length; i++) {
			var ship = this.aliens.create(10 + (i * (game.width * 0.18)), 50, alienPattern[i]);
			ship.alienMoveTimer = this.initialAlienMoveTimer;
			ship.scale.setTo(1 / this.scaleRatio, 1 / this.scaleRatio);
			ship.body.setSize(71, 145, 30, 5);
			ship.health = 50;
			ship.body.velocity.y = 100;
			ship.movePattern = this.generateMovePattern(alienPattern.length, game.width - 50, 100);
			ship.moveCursor = 0;
		}

		// Inputs
		this.cursors = game.input.keyboard.createCursorKeys();
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		
		// Bullets
		this.bullets = game.add.group();
		this.bullets.enableBody = true;
		var that =  this;
		this.spaceKey.onDown.add(function() {
			that.fireBullet();
			that.timer = 10;
		});
		this.bulletSound = game.add.audio("laser");

		this.explosions = game.add.group();

		this.graphics.lineStyle(2, 0xFF0000, 1);
	    this.graphics.drawRect(this.aliens.left, this.aliens.top, this.aliens.width, this.aliens.height);
     },

     generateMovePattern: function(shipCount, arenaWidth, baseVelocity) {
     	var shipDistance = arenaWidth / shipCount;
     	var pattern = [];
     	var baseVerticalVelocity = baseVelocity / 2
     	pattern.push([baseVelocity, -baseVerticalVelocity, shipDistance / baseVelocity]);
     	pattern.push([-baseVelocity, baseVerticalVelocity, 20 / baseVerticalVelocity]);
     	pattern.push([-baseVelocity, -baseVerticalVelocity, shipDistance / baseVelocity]);
     	pattern.push([baseVelocity, baseVerticalVelocity, 20 / baseVerticalVelocity]);
     	return pattern;

     },

     update: function(){
	    game.physics.arcade.overlap(this.bullets, this.aliens, this.hitAlien, null, this);
	    
		
		// When the left cursor is down the ship moves to the left and tilts
		if(this.cursors.left.isDown) {
			this.hero.animations.play("left");
			this.hero.body.velocity.x = -this.speedChange;
		}

		// When the right cursor is down the ship moves to the right and tilts
		else if(this.cursors.right.isDown) {
			this.hero.animations.play("right");
			this.hero.body.velocity.x = this.speedChange;
		}

		// When no cursor is pressed the original position is reinstated and the ship stops moving
		else {
			this.hero.frame = 0;
			this.hero.body.velocity.x = 0;
		}

		// When the spacebar is held down it repeatedly fires bullets (after 10 ticks)
		if(this.spaceKey.isDown) {
			this.timer--;
			if(this.timer == 0) {
				this.fireBullet();
				this.timer = 10;
			}

		}

		// Destroys bullets after they go off the screen so they don't take up more memory
		this.bullets.forEachAlive(function(bullet) {
			if(bullet.body.y < 0) {
				bullet.destroy();
			}
		});
		
		// Cleans up any "dead" bullets
		this.bullets.forEachDead(function(bullet){
			bullet.destroy();
		});

		var that = this;
		this.aliens.forEachAlive(function(alien){
			if(alien.hitTimer > 0){
				alien.hitTimer--;
			}
			else{
				alien.tint = 16777215;	
			}
			
			if (game.time.totalElapsedSeconds() >= alien.alienMoveTimer) {
				alien.body.velocity.x += alien.movePattern[alien.moveCursor][0];
				alien.body.velocity.y += alien.movePattern[alien.moveCursor][1];
				alien.alienMoveTimer = game.time.totalElapsedSeconds() + alien.movePattern[alien.moveCursor][2];
				alien.moveCursor++;
				if(alien.moveCursor >= alien.movePattern.length) {
					alien.moveCursor = 0;
				}
				
				
			}
		});



	 },



	 fireBullet: function() {
		var bullet = this.bullets.create(this.hero.x + (38.0  / this.scaleRatio), this.hero.y - (18.0 / this.scaleRatio), "bullet");
		bullet.scale.setTo(1 / this.scaleRatio, 1 / this.scaleRatio);
		bullet.body.velocity.y = -400;
		bullet.animations.add("firing", [0, 1, 2], 10, true);
		bullet.animations.play("firing");

		var bullet2 = this.bullets.create(this.hero.x + (82.0 / this.scaleRatio), this.hero.y - (18.0 / this.scaleRatio), "bullet");
		bullet2.scale.setTo(1 / this.scaleRatio, 1 / this.scaleRatio);
		bullet2.body.velocity.y = -400;
		bullet2.animations.add("firing", [0, 1, 2], 10, true);
		bullet2.animations.play("firing");

		//Plays laser sound when bullet is fired
		this.bulletSound.play();
	 },

	 hitAlien: function(bullet, alien) {
		alien.health = alien.health - 10;
		if (alien.health <= 0) {
			var explosion = this.explosions.create(alien.x - (10 / this.scaleRatio), alien.y + (10 / this.scaleRatio), "explosions");
			explosion.scale.setTo(1.5 / this.scaleRatio, 1.5 / this.scaleRatio);
			explosion.animations.add("explosions");
			explosion.animations.play("explosions", 30, false);
			this.ExplosionSound.play();
			alien.destroy();
		}

		alien.tint = 0xFF0000;
		alien.hitTimer = 5;

		var emitter = game.add.emitter(bullet.x, bullet.y, 20);
		emitter.makeParticles("particle");
		emitter.gravity = 5;
		emitter.minParticleScale = 0.1;
		emitter.maxParticleScale = 0.25;
		emitter.start(true, 300, null, 2000);
		bullet.kill();
	 }


 }