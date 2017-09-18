//setting game configuration and loading the assets for the loading screen
InitState = {
  init: function() {
	this.game.physics.startSystem(Phaser.Physics.ARCADE);
  },
  preload: function() {
    //assets we'll use in the loading screen
    this.load.image('title', 'assets/images/title.png');
  },
  create: function() {
    this.state.start('Preload');
  }
};