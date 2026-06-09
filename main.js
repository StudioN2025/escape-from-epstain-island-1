import { MenuScene } from './src/MenuScene.js';
import { Game } from './game.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

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
        { type: 'texture', path: 'assets/textures/stucco-5.jpg', name: 'stuccoWall' },
        { type: 'texture', path: 'assets/textures/stucco-9.jpg', name: 'stuccoCeiling' },
        { type: 'texture', path: 'assets/textures/sand-1.jpg', name: 'sand' },
        { type: 'texture', path: 'assets/textures/grass-2.jpg', name: 'grass' },
        { type: 'texture', path: 'assets/textures/laminate-2.jpg', name: 'laminate' },
        { type: 'model', path: 'assets/models/key.glb', name: 'key' },
        { type: 'model', path: 'assets/models/date_palm.glb', name: 'palm' },
        { type: 'model', path: 'assets/models/campfire.glb', name: 'campfire' },
        { type: 'model', path: 'assets/models/wooden_boat.glb', name: 'boat' },
        { type: 'model', path: 'assets/models/old_torch_with_wall_mounting.glb', name: 'torch' },
        { type: 'model', path: 'assets/models/old_barrel_free_download.glb', name: 'barrel' },
        { type: 'model', path: 'assets/models/medieval_door.glb', name: 'door' },
        { type: 'model', path: 'assets/models/canister.glb', name: 'canister' },
        { type: 'model', path: 'assets/models/house.glb', name: 'house' },
        { type: 'sound', path: 'assets/sounds/menu.mp3', name: 'menu' },
        { type: 'sound', path: 'assets/sounds/death.mp3', name: 'death' },
        { type: 'sound', path: 'assets/sounds/win.mp3', name: 'win' },
    ];
    
    const total = resources.length;
    let loaded = 0;
    
    const updateProgress = (status) => {
        loaded++;
        const percent = Math.floor((loaded / total) * 100);
        loadingBar.style.width = percent + '%';
        loadingPercent.innerText = percent + '%';
        loadingStatus.innerText = status;
    };
    
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();
    
    const loadPromises = resources.map(res => {
        return new Promise((resolve) => {
            if (res.type === 'texture') {
                textureLoader.load(res.path, (texture) => {
                    updateProgress(`Загружена текстура: ${res.name}`);
                    resolve();
                }, undefined, (err) => {
                    console.warn(`Ошибка текстуры ${res.name}:`, err);
                    updateProgress(`Ошибка: ${res.name}`);
                    resolve();
                });
            } else if (res.type === 'model') {
                const loader = res.path.endsWith('.fbx') ? fbxLoader : gltfLoader;
                loader.load(res.path, (model) => {
                    updateProgress(`Загружена модель: ${res.name}`);
                    resolve();
                }, undefined, (err) => {
                    console.warn(`Ошибка модели ${res.name}:`, err);
                    updateProgress(`Ошибка: ${res.name}`);
                    resolve();
                });
            } else if (res.type === 'sound') {
                const audio = new Audio(res.path);
                audio.addEventListener('canplaythrough', () => {
                    updateProgress(`Загружен звук: ${res.name}`);
                    resolve();
                });
                audio.addEventListener('error', () => {
                    console.warn(`Ошибка звука ${res.name}`);
                    updateProgress(`Ошибка: ${res.name}`);
                    resolve();
                });
                audio.load();
            }
        });
    });
    
    await Promise.all(loadPromises);
    loadingStatus.innerText = 'Загрузка завершена!';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        const menu = new MenuScene(() => {
            const game = new Game();
            game.start();
        });
    }, 500);
}

showWelcomeAndWait();
