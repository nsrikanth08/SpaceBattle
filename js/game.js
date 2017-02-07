
var w = window.innerWidth;
var h = window.innerHeight;


var game = new Phaser.Game(w, h, Phaser.AUTO, 'gameContainer', {preload: preload, create:create, update: update});
var background;
var hero;
var cursors;
var speedChange = 200;
var graphics;
var bullets;

function preload() {
 	game.load.image("stars", "assets/background.png");
    game.load.spritesheet("spaceship", "assets/spaceship2.png", 136, 84);
    game.load.spritesheet("bullet", "assets/bullet1.png", 15, 18);
    game.load.audio("laser", "assets/BulletFire.ogg");
}

function create() {
	graphics = game.add.graphics(100, 100);
	game.physics.startSystem(Phaser.Physics.ARCADE);
	
	// Background
	background = game.add.sprite(0, 0, "stars");
	background.scale.setTo(2.5, 2.5);
	
	// Hero
	hero = game.add.sprite((w/2) - 26, h - 120, "spaceship");
	game.physics.arcade.enable(hero);
	hero.body.collideWorldBounds = true;
	hero.animations.add("left", [1], 10, true);
	hero.animations.add("right", [2], 10, true);

	// Inputs
	cursors = game.input.keyboard.createCursorKeys();
	this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	
	// Bullets
	bullets = game.add.group();
	bullets.enableBody = true;
	var that =  this;
	this.spaceKey.onDown.add(function() {
		fireBullet(that);
		that.timer = 10;
	});
	this.bulletSound = game.add.audio("laser");

}

function fireBullet(that) {
	var bullet = bullets.create(hero.x + 38, hero.y - 18, "bullet");
	bullet.body.velocity.y = -300;
	bullet.animations.add("firing", [0, 1, 2], 10, true);
	bullet.animations.play("firing");

	var bullet2 = bullets.create(hero.x + 82, hero.y - 18, "bullet");
	bullet2.body.velocity.y = -300;
	bullet2.animations.add("firing", [0, 1, 2], 10, true);
	bullet2.animations.play("firing");

	that.bulletSound.play();
}

function update() {
	
	if(cursors.left.isDown) {
		hero.animations.play("left");
		hero.body.velocity.x = -speedChange;
	}

	else if(cursors.right.isDown) {
		hero.animations.play("right");
		hero.body.velocity.x = speedChange;
	}

	else {
		hero.frame = 0;
		hero.body.velocity.x = 0;
	}

	if(this.spaceKey.isDown) {
		this.timer--;
		if(this.timer == 0) {
			fireBullet(this);
			this.timer = 10;
		}

	}

	bullets.forEachAlive(function(bullet) {
		if(bullet.body.y < 0) {
			bullet.destroy();
		}
	});
	
}

