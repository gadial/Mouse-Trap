//setting game configuration and loading the assets for the loading screen

var sprite_images = ['juicero', 'piston', 'ball', 'teacup'];
var sprite_sheets = {
	'mouse': {width: 56, height: 50, animations: {
		'left': [0, 1, 2, 3, 4, 5, 6, 7],
		'right': [8, 9, 10, 11, 12, 13, 14, 15],
		'die': [16,17,16,17,16,17,16,17,16,17,18,19,20,21,22]
	}},
	'exit': {width: 32, height: 51, animations: {
	}},
	'troll': {width: 64, height: 64, animations: {
		'left': [0,1,2,3,4,5,6,7],
		'right': [8,9,10,11,12,13,14,15]
	}},
	'cloud': {width: 62, height: 30, animations:{
		'stand': [0,1,2,3]
	}},
	'snail': {width: 48, height: 22, animations:{
		'left': [0],
		'right': [1]
	}},
	'clown': {width: 64, height: 72, animations:{
		'stand': [0,1,2]
	}},
	'insect': {width: 64, height: 60, animations:{
		'stand': [0,1,2,3]
	}},
	'ghost': {width: 54, height: 54, animations:{
		'stand': [0,1,2]
	}},
	'skull': {width: 50, height: 60, animations:{
		'stand': [0,1,2,3]
	}},
	'fish': {width: 64, height: 30, animations:{
		'stand': [0,1,2]
	}},
	'cheese': {width: 62, height: 62, animations:{
		'stand': [0,1,2,3]
	}},
	'circle': {width: 38, height: 38, animations:{
		'stand': [0,1,2,3]
	}},
	'spider': {width: 62, height: 28, animations:{
		'stand': [0,1,2,3]
	}},
	'rocket': {width: 50, height: 64, animations:{
		'stand': [0,1,2,3]
	}},
	'explosion': {width: 60, height: 50, animations:{
		'stand': [0,1,2,3,4,5]
	}},
}

function preload_sprites(){
	sprite_images.forEach(function(s){
		game.load.image(s,'assets/sprites/' + s + '.png');
	});
	for (var s in sprite_sheets){
		game.load.spritesheet(s,'assets/sprites/' + s + '.png', sprite_sheets[s].width, sprite_sheets[s].height);
	}	
}

PreloadState = {
  preload: function() {
//	this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title');
	this.add.sprite(0,0, 'title');
    	
	preload_sprites();
//    game.load.tilemap('map', 'assets/tilemaps/maps/level3.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'assets/tilemaps/tiles/tiles.png');
	game.load.spritesheet("tilesSprites", "assets/tilemaps/tiles/tiles.png", 32, 32);
  },
  create: function() {
	game.ctrlKey = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
    this.state.start('Game', true, false, 11);
  }
};