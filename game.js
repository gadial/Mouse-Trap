var TILE_SIZE = 16;
var map;
var layer;
var platformLayer;
var solidLayer;
var goalLayer;
var goals;
var exit;
var entities;
var goal_count = 0;
// var sprite;
var cursors;
var currentDataString;
var covers;
var boundingBoxes;

var MAX_LEVEL = 8;
var TERMINAL_VELOCITY = 300;

var platformCollision = {up: true, down: false, left: false, right: false};

function findObjectsByType(targetType, tilemap, layer){
	var result = [];

	tilemap.objects[layer].forEach(function(element){
	  if(element.properties !== undefined && element.properties.type == targetType) {
		result.push(element);
	  }
	}, this);

	return result;
}

function eachTile(map, layer, func){
	layer = map.getLayer(layer);
	for (var y = 0; y < map.layers[layer].height; y++){
            for (var x = 0; x < map.layers[layer].width; x++){
                var tile = map.layers[layer].data[y][x];
				if (tile.index != -1){
					func(tile);
				}
			}
	}
}

function addTilesToGroup(map, layer, group, callback){
		eachTile(map, layer, function(tile){
			p = group.create(tile.worldX, tile.worldY, 'tilesSprites', tile.index - 1);
			p.body.immovable = true;
			if (callback !== undefined){
				callback(p);
			}
		});
}

function closeEnough(x1,y1,x2,y2){
	return (Math.abs(x1-x2) + Math.abs(y1-y2) <= 3);
}

function coordsCloseEnough(a,b){
	return closeEnough(a.x, a.y, b.x, b.y);
}

function updatePatrol(){
//	console.log(this.properties.image, " at ", [this.x, this.y]);
	if (coordsCloseEnough(this,this.waypoints[this.currentWaypoint])){
		if ((this.delta == 1 && this.currentWaypoint == this.waypoints.length - 1) || this.delta == -1 && this.currentWaypoint == 0){
			this.delta *= -1;
		}
		this.currentWaypoint = this.currentWaypoint + this.delta; 
//		console.log(this.properties.image, " Going to waypoint ", this.currentWaypoint)
		game.physics.arcade.moveToXY(this, this.waypoints[this.currentWaypoint].x, this.waypoints[this.currentWaypoint].y, this.speed);
	}
	if (this.properties.animationType == 'leftAndRight'){
		if (this.body.deltaX() > 0){
			this.animations.play('right');
		} else {
			this.animations.play('left');
		}
	}
}

function updateCycle(){
	if (coordsCloseEnough(this,this.waypoints[this.currentWaypoint])){
		if (this.currentWaypoint != this.waypoints.length - 1){
			this.currentWaypoint++;
		} else {
			this.x = this.waypoints[0].x;
			this.y = this.waypoints[0].y;
			this.currentWaypoint = 1;
		}
		game.physics.arcade.moveToXY(this, this.waypoints[this.currentWaypoint].x, this.waypoints[this.currentWaypoint].y, this.speed);
	}
	if (this.properties.animationType == 'leftAndRight'){
		if (this.body.deltaX() > 0){
			this.animations.play('right');
		} else {
			this.animations.play('left');
		}
	}
}

function updateBounce(){
//	game.physics.arcade.collide(this, solids);
	game.physics.arcade.collide(this, boundingBoxes);
}

function parseWaypoints(s){
	if (s === undefined){
		return [];
	}
	var sArr = s.split(",");
	if (sArr.length % 2 != 0){
		return [];
	}
	var i = 0;
	var waypoints = [];
	while (i < sArr.length){
		waypoints.push({x: parseInt(sArr[i]), y: parseInt(sArr[i+1])});
		i += 2;
	}
	return waypoints;
}

function yFix(entity, y){
	return (y - (entity.height - TILE_SIZE));
}

function fixWaypointsY(e){
	for (var n = 0; n < e.waypoints.length; ++n){
		e.waypoints[n].y = yFix(e,e.waypoints[n].y);
	}
}

function createEntity(entity){
	console.log("Creating entity ", entity);
	var offset = 0;
	if (entity.properties.image == 'tilesSprites'){
		offset = entity.gid - 1;
	}
	e = entities.create(entity.x, yFix(entity, entity.y), entity.properties.image, offset);
	e.properties = entity.properties;
	e.body.immovable = true;
	e.speed = 60; //Phaser default
	if (entity.properties.animationType == 'leftAndRight'){
		animations = sprite_sheets[entity.properties.image].animations
		e.animations.add('left', animations.left, 10, true);
		e.animations.add('right', animations.right, 10, true);
	}
	if (entity.properties.animationType == 'stand'){
		animations = sprite_sheets[entity.properties.image].animations
		e.animations.add('stand', animations.left, 3, true);
		e.animations.play('stand');
	}
	
	if (entity.properties.speed !== undefined){
		console.log("Seeting speed to ",entity.properties.speed);
		e.speed = entity.properties.speed;
	}
	if (entity.properties.movementType == 'patrol' || entity.properties.movementType == 'cycle'){
		e.waypoints = parseWaypoints(entity.properties.waypoints);
		fixWaypointsY(e); //the y coordinate of entities always has an annoying y coordinate offset
		e.delta = 1;
		var i = entity.properties.initialWaypoint;
		if (i !== undefined && e.waypoints[i] !== undefined){
			game.physics.arcade.moveToXY(e, e.waypoints[i].x, e.waypoints[i].y, e.speed);
			e.currentWaypoint = i;
			if (entity.properties.movementType == 'patrol'){
				e.update = updatePatrol;
			}
			if (entity.properties.movementType == 'cycle'){
				e.update = updateCycle;
			}
		} else {
			console.warn("Problem with entity ", entity, ": seems like initalWaypoint is undefined")
		}
	}
	
	if (entity.properties.movementType == 'bounce'){
		e.body.collideWorldBounds = true;
        e.body.bounce.set(1);
		e.body.velocity.setTo(e.speed,e.speed);
		e.update = updateBounce;
		e.body.immovable = false;
	}
	
	if (entity.properties.hazard == 'all'){
		e.hazards = {left: true, right: true, up: true, down: true};
	}
	
	if (entity.properties.hazard == 'sides'){
		e.hazards = {left: true, right: true};
	}
	
	if (entity.properties.hazard == 'allButAbove'){
		e.hazards = {left: true, right: true, down: true};
	}
	
	if (entity.properties.hazard == 'peacefulPlatform'){
		e.hazards = {};
		e.body.checkCollision = platformCollision;
	}
	
	
	if (entity.properties.image == 'juicero'){ //TODO: not a good way to check this!
		//tileSprite = game.add.tileSprite(e.x + 16, entity.properties.pistonY, 16, 10, 'piston');
		piston = game.add.tileSprite(e.x + 22, entity.properties.pistonY, 16, 10, 'piston');
		entities.add(piston);
		piston.hazards = {left: true, right: true, up: true, down: true};
		piston.entity = e;
		piston.body.immovable = true;
		piston.update = function() {
			this.height = this.entity.y - this.y;
		}
	}
	
	console.log("Done creating ",e);
}
	
function create() {

	//game.stage.backgroundColor = '#2F8F8F';

	var tilemapData = game.cache.getTilemapData('map');
    var mapData = tilemapData.data;
	game.stage.backgroundColor = mapData.backgroundcolor;

    map = game.add.tilemap('map',TILE_SIZE,TILE_SIZE);
	
    map.addTilesetImage('tiles');

	boundingBoxes = this.add.group();
	boundingBoxes.enableBody = true;
	var boxesArr = findObjectsByType('boundingBox', map, 'Object Layer');
	boxesArr.forEach(function(box){
		b = boundingBoxes.create(box.x, box.y + TILE_SIZE);
		b.body.height = box.height;
		b.body.width = box.width;
		b.body.immovable = true;
	});
	
	entities = this.add.group();
	entities.enableBody = true;
	var entityArr = findObjectsByType('entity', map, 'Object Layer');
	console.log("Found entitites ", entityArr);
	entityArr.forEach(createEntity);

	
	solids = this.add.group();
	solids.enableBody = true;
	addTilesToGroup(map, 'Solid Layer', solids);
	addTilesToGroup(map, 'Platform Layer', solids, function(p){
		p.body.checkCollision = platformCollision;
	});
	addTilesToGroup(map, 'Sinking Platform Layer', solids, function(p){
		p.body.checkCollision = platformCollision;
		p.body.drag.y = 25;
		p.origin_y = p.y;
		p.is_sinking = true;
	});

	layer = map.createLayer('Background Layer');
    layer.resizeWorld();
	
	goals = this.add.group();
	goals.enableBody = true;
	addTilesToGroup(map, 'Goal Layer', goals, function(){goal_count++});

	map.setCollisionByExclusion([], true, 'Solid Layer');
	
	covers = this.add.group();
	covers.enableBody = true;
	var coverArr = findObjectsByType('cover', map, 'Object Layer');
	coverArr.forEach(function(c){
		cSprite = covers.create(c.x,c.y + TILE_SIZE);
		cSprite.body.height = c.height;
		cSprite.body.width = c.width;
		console.log("cSprite created: ", cSprite);
	});
	

	var exitArr = findObjectsByType('exit', map, 'Object Layer');
	exit = game.add.sprite(exitArr[0].x, exitArr[0].y - 28, 'exit');
	game.physics.arcade.enable(exit);
	exit.body.immovable = true;
	exit.body.setSize(8,32,12,14);
	exit.open = false;
	exit.animations.add('exit',[2,3,4,5,0], 5, false);
	
	var playerArr = findObjectsByType('player', map, 'Object Layer');
	player = game.add.sprite(playerArr[0].x, playerArr[0].y - 32, 'mouse');
	player.status = 'alive';

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 400;
	player.body.setSize(26, 48, 0, 0);
	player.body.horizontalFacing = Phaser.LEFT;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3, 4, 5, 6, 7], 10, true);
    player.animations.add('right', [8, 9, 10, 11, 12, 13, 14, 15], 10, true);
	player.animations.add('die', [16,17,16,17,16,17,16,17,16,17,18,19,20,21,22], 10, false);

		
	cursors = game.input.keyboard.createCursorKeys();
}

function getTileProperties() {

    var x = layer.getTileX(game.input.activePointer.worldX);
    var y = layer.getTileY(game.input.activePointer.worldY);

    var tile = map.getTile(x, y, layer);
    
    // Note: JSON.stringify will convert the object tile properties to a string
    currentDataString = JSON.stringify( tile.properties );

    tile.properties.wibble = true;

}

function collectGoal(player, goal){
	//console.log("Goal touched! ", goal);
	goal.kill();
	goal_count--;
	if (goal_count == 0){
		open_exit();
	}
}

function open_exit(){
	exit.frame = 1;
	exit.open = true;
}

function collideWithSolid(player, solid){
	if (player.at_terminal_velocity){
		terminatePlayer(player);
		return;
	}
	if (solid.is_sinking){
		if (player.y + 48 <= solid.y){ //check if the legs of the mouse are standing on top of the platform
			solid.body.velocity.y = 25;
			if (solid.origin_y + 20 <= solid.y){
				solid.kill();
			}
		}
	}
}


function isPlayerDown(player){
	return (player.body.blocked.down || player.body.touching.down);
}

function attemptExit(player, exit){
	if (exit.open){
		player.kill();
		exit.animations.play('exit');
		exit.animations.currentAnim.onComplete.add(function() {GameState.nextLevel()});
	}
}

function terminatePlayer(player){
	player.status = 'dying';
	console.log("Terminate player ", player);
	player.body.enable = false
	player.animations.stop();
	player.animations.play('die');
	player.animations.currentAnim.onComplete.add(function () {	GameState.restart()});
}

function isContained(a,b){
	return (a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height);
}

  
function collideWithHazard(player, hazard){
	if (player.at_terminal_velocity){
		terminatePlayer(player);
		return;
	}
	if (hazard.body.touching === undefined || hazard.hazards === undefined){
		console.warn("Something is not working right with hazard ", hazard);
		return;
	}
	if (hazard.hazards.left && hazard.body.touching.left){
		console.log("Kill from left!");
		terminatePlayer(player)
	}
	if (hazard.hazards.right && hazard.body.touching.right){
		console.log("Kill from right!");
		terminatePlayer(player)
	}
	if (hazard.hazards.up && hazard.body.touching.up){
		console.log("Kill from up!");
		terminatePlayer(player)
	}
	if (hazard.hazards.down && hazard.body.touching.down){
		console.log("Kill from down!");
		terminatePlayer(player)
	}
}

function touchCover(player, cover){
		if (isContained(player.body, cover.body)){
			player.covered = true;
		} else {
			player.covered = false;
		}
}

function shouldCollideWithHazard(player, hazard){
	if (player.covered == true){
		return false;
	}
	
	return true;
}

function update() {
	if (player.body.velocity.y > TERMINAL_VELOCITY){
		player.at_terminal_velocity = true;
	}
	game.physics.arcade.collide(player, solids, collideWithSolid);
	game.physics.arcade.collide(player, exit, attemptExit);
	game.physics.arcade.collide(player, entities, collideWithHazard, shouldCollideWithHazard);
	game.physics.arcade.overlap(player, goals, collectGoal);
	game.physics.arcade.overlap(player, covers, touchCover);
	if (player.status == 'alive'){
		if (isPlayerDown(player)){
			player.body.velocity.x = 0;
		}
		if (cursors.left.isDown)
		{
			if (game.ctrlKey.isDown){ //cheat!!!!!
				GameState.previousLevel();
			}
			//  Move to the left
			if (isPlayerDown(player)){
				if (player.body.horizontalFacing == Phaser.RIGHT){
					player.body.horizontalFacing = Phaser.LEFT;
					player.body.setSize(20, 48, 0, 0);
					player.body.x = player.body.x + 30;
				}
				player.animations.play('left');
			}
			player.body.velocity.x = -150;
		}
		else if (cursors.right.isDown)
		{
			if (game.ctrlKey.isDown){ //cheat!!!!!
				GameState.nextLevel();
			}
			//  Move to the right
			if (isPlayerDown(player)){
				if (player.body.horizontalFacing == Phaser.LEFT){
					player.body.horizontalFacing = Phaser.RIGHT;
					player.body.setSize(20, 48, 30, 0);
					player.body.x = player.body.x - 30;
				}
				player.animations.play('right');
			}
			player.body.velocity.x = 150;
		}
		else
		{
			//  Stand still
			player.animations.stop();
			if (player.body.horizontalFacing == Phaser.LEFT){
				player.frame = 5;
			}
			if (player.body.horizontalFacing == Phaser.RIGHT){
				player.frame = 14;
			}
		}
		if (!isPlayerDown(player)){
			player.animations.stop();  
		}		
		
		//  Allow the player to jump if they are touching the ground.
		if (cursors.up.isDown && isPlayerDown(player))
		{
			player.body.velocity.y = -200;
		}
	}
}

function render() {

//   game.debug.bodyInfo(player, 32, 460);
//   game.debug.body(player);
//   game.debug.body(covers.children[0]);
//   game.debug.body(exit);
}

GameState = {
  init: function(level){this.level = level;},
  preload: function(){
	  level_file = 'assets/tilemaps/maps/level' + this.level + '.json';
	  this.game.load.tilemap('map', level_file, null, Phaser.Tilemap.TILED_JSON);
	},
  create: create,
  update: update,
  
  restart: function(){
    this.game.state.start('Game', true, false, this.level);
  },
  
  nextLevel: function(){
	  if (this.level < MAX_LEVEL){
		this.game.state.start('Game', true, false, this.level + 1);
	  }
  },
  
  previousLevel: function(){
	  if (this.level > 1){
		this.game.state.start('Game', true, false, this.level - 1);
	  }
  }
};