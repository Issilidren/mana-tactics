import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import TitleScene from './scenes/TitleScene.js'
import StarterPickScene from './scenes/StarterPickScene.js'
import HubScene from './scenes/HubScene.js'
import WorldMapScene from './scenes/WorldMapScene.js'
import { clubScenes } from './scenes/ClubScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#080510',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  // Boot → Title → (first time) StarterPick → Hub → WorldMap ↔ Clubs
  scene: [BootScene, TitleScene, StarterPickScene, HubScene, ...clubScenes, WorldMapScene],
}

export default config
