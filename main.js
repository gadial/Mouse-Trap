var game = new Phaser.Game(560, 600, Phaser.AUTO);

game.state.add('Init', InitState); 
game.state.add('Preload', PreloadState); 
game.state.add('Game', GameState); 


game.state.start('Init'); 
