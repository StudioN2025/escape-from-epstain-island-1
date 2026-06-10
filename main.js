import * as THREE from 'three';
import { AssetManager } from './AssetManager.js';
import { MenuScene } from './src/MenuScene.js';
import { Game } from './game.js';

const welcomeScreen = document.getElementById('welcome-screen');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingPercent = document.getElementById('loading-percent');
const loadingStatus = document.getElementById('loading-status');

function showWelcomeAndWait() {
    welcomeScreen.style.display = 'flex';
    const startLoading = () => {
        welcomeScreen.style.display = 'none';
        startLoadingResources();
    };
    welcomeScreen.addEventListener('click', startLoading);
    window.addEventListener('keydown', startLoading, { once: true });
}

async function startLoadingResources() {
    loadingScreen.style.display = 'flex';
    loadingBar.style.width = '0%';
    loadingPercent.innerText = '0%';
    loadingStatus.innerText = 'Загрузка текстур...';
    
    const resources = [
        // Текстуры
        { type: 'texture', path: 'assets/textures/stucco-5.jpg', name: 'stuccoWall' },
        { type: 'texture', path: 'assets/textures/stucco-9.jpg', name: 'stuccoCeiling' },
        { type: 'texture', path: 'assets/textures/sand-1.jpg', name: 'sand' },
        { type: 'texture', path: 'assets/textures/grass-2.jpg', name: 'grass' },
        { type: 'texture', path: 'assets/textures/laminate-2.jpg', name: 'laminate' },
        // Модели
        { type: 'model', path: 'assets/models/key.glb', name: 'key' },
        { type: 'model', path: 'assets/models/date_palm.glb', name: 'palm' },
        { type: 'model', path: 'assets/models/campfire.glb', name: 'campfire' },
        { type: 'model', path: 'assets/models/wooden_boat.glb', name: 'boat' },
        { type: 'model', path: 'assets/models/old_torch_with_wall_mounting.glb', name: 'torch' },
        { type: 'model', path: 'assets/models/old_barrel_free_download.glb', name: 'barrel' },
        { type: 'model', path: 'assets/models/medieval_door.glb', name: 'door' },
        { type: 'model', path: 'assets/models/canister.glb', name: 'canister' },
        { type: 'model', path: 'assets/models/house.glb', name: 'house' },
        { type: 'model', path: 'assets/models/dance.fbx', name: 'dance' },
        { type: 'model', path: 'assets/models/epstein_run.fbx', name: 'epstein_run' },
        // Звуки
        { type: 'sound', path: 'assets/sounds/menu.mp3', name: 'menu' },
        { type: 'sound', path: 'assets/sounds/death.mp3', name: 'death' },
        { type: 'sound', path: 'assets/sounds/win.mp3', name: 'win' },
    ];
    
    const assetManager = new AssetManager();
    
    await assetManager.loadAll(resources, (percent, status) => {
        loadingBar.style.width = percent + '%';
        loadingPercent.innerText = percent + '%';
        loadingStatus.innerText = status;
    });
    
    loadingStatus.innerText = 'Готово!';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        const menu = new MenuScene(assetManager, () => {
            const game = new Game(assetManager);
            game.start();
        });
    }, 500);
}

showWelcomeAndWait();
