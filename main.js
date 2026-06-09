import { MenuScene } from './src/MenuScene.js';
import { Game } from './game.js';

function startGame() {
    const game = new Game();
    game.start();
}

// Запускаем меню
const menu = new MenuScene(startGame);
