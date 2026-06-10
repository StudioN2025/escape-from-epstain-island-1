import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Player } from './src/Player.js';
import { Monster } from './src/Monster.js';
import { World } from './src/World.js';
import { Inventory } from './src/Inventory.js';
import { StoryManager } from './src/StoryManager.js';
import { UIManager } from './src/UI.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.epstein = null;
        this.world = null;
        this.inventory = null;
        this.story = null;
        this.ui = null;
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.pitch = 0;
        this.yaw = -Math.PI / 4;
        
        this.gameActive = false;
        this.gamePhase = 'basement';
        this.raycaster = new THREE.Raycaster();
        this.fbxMixer = null;
        this.fbxModel = null;
        this.pointerLocked = false;
        this.loadingProgress = 0;
        
        this.stamina = 100;
        this.maxStamina = 100;
        this.inventoryOpen = false;
        this.boatQuestStarted = false;
        
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 2.0;
        this.originalCameraPos = null;
        this.deathSound = null;
        
        this.isWinning = false;
        this.winTimer = 0;
        this.winDuration = 3.0;
        this.winSound = null;
        
        this.settings = {
            shadows: true,
            brightness: 0.55
        };
        
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch(e) {}
        }
    }
    
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
        if (this.world) {
            this.world.settings.brightness = this.settings.brightness;
            this.world.setupSunLighting();
        }
    }
    
    updateLoadingProgress(percent, status) {
        this.loadingProgress = percent;
        console.log(`Загрузка: ${percent}% - ${status}`);
    }
    
    async init() {
        this.updateLoadingProgress(5, 'Инициализация рендерера...');
        this.setupRenderer();
        this.updateLoadingProgress(15, 'Создание мира...');
        this.setupWorld();
        this.updateLoadingProgress(25, 'Настройка освещения...');
        this.setupLighting();
        this.updateLoadingProgress(35, 'Загрузка игрока...');
        this.player = new Player(this.camera);
        this.updateLoadingProgress(45, 'Загрузка Эпштейна...');
        this.epstein = new Monster(this.scene);
        this.updateLoadingProgress(55, 'Загрузка инвентаря...');
        this.inventory = new Inventory();
        this.updateLoadingProgress(60, 'Загрузка интерфейса...');
        this.ui = new UIManager();
        this.updateLoadingProgress(65, 'Загрузка сюжета...');
        this.story = new StoryManager(this.ui, this.inventory);
        window.gameInstance = this;
        this.updateLoadingProgress(70, 'Настройка управления...');
        this.setupEventListeners();
        this.updateLoadingProgress(75, 'Создание подвала...');
        await this.world.createBasement();
        this.updateLoadingProgress(85, 'Создание объектов...');
        this.world.createInteractiveObjects(this.handleInteraction.bind(this));
        this.updateLoadingProgress(90, 'Загрузка модели Эпштейна...');
        await this.loadEpsteinFBX();
        
        this.deathSound = new Audio('assets/sounds/death.mp3');
        this.deathSound.load();
        this.winSound = new Audio('assets/sounds/win.mp3');
        this.winSound.load();
        
        this.updateLoadingProgress(100, 'Готово!');
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.style.display = 'none';
            document.getElementById('game-ui')?.classList.remove('hidden');
            this.gameActive = true;
            this.story.startGame();
        }, 500);
        this.animate();
    }
    
    async loadEpsteinFBX() {
        const loader = new FBXLoader();
        const fbxPath = 'assets/models/epstein_run.fbx';
        return new Promise((resolve) => {
            loader.load(fbxPath, (fbx) => {
                if (this.epstein.mesh) this.scene.remove(this.epstein.mesh);
                fbx.scale.setScalar(0.02);
                fbx.position.copy(this.epstein.position);
                fbx.castShadow = this.settings.shadows;
                this.fbxMixer = new THREE.AnimationMixer(fbx);
                if (fbx.animations.length) {
                    const action = this.fbxMixer.clipAction(fbx.animations[0]);
                    action.play();
                }
                this.scene.add(fbx);
                this.epstein.mesh = fbx;
                this.epstein.useFBX = true;
                this.epstein.mixer = this.fbxMixer;
                resolve(true);
            }, (xhr) => {
                if (xhr.total) {
                    const percent = Math.floor((xhr.loaded / xhr.total) * 100);
                    this.updateLoadingProgress(90 + Math.floor(percent * 0.1), `Загрузка модели Эпштейна: ${percent}%`);
                }
            }, () => {
                console.warn('⚠️ Модель epstein_run.fbx не найдена, использую стандартную');
                resolve(false);
            });
        });
    }
    
    setupRenderer() { /* без изменений */ }
    setupWorld() { this.world = new World(this.scene, this.settings); }
    setupLighting() { /* без изменений */ }
    setupEventListeners() { /* без изменений */ }
    toggleInventory() { /* без изменений */ }
    onWindowResize() { /* без изменений */ }
    checkInteraction() { /* без изменений */ }
    
    handleInteraction(type, data) {
        switch(type) {
            case 'key':
                console.log('🔑 Ключ подобран! Добавляем в инвентарь');
                if (this.inventory) {
                    this.inventory.addItem('key', '🔑');
                } else {
                    console.error('Инвентарь не инициализирован');
                }
                this.story.completeQuest('find_key');
                this.ui.showMessage('🔑 Вы нашли ключ! Нажмите F для инвентаря.', 5000);
                if (!this.inventoryOpen) {
                    this.toggleInventory();
                    setTimeout(() => {
                        if (this.inventoryOpen) this.toggleInventory();
                    }, 3000);
                }
                this.world.showExitDoor();
                break;
            case 'door':
                if (this.inventory.hasItem('key')) this.transitionToIsland();
                else this.ui.showMessage('🔒 Дверь заперта. Нужен ключ!', 2000);
                break;
            case 'boat':
                if (this.gamePhase === 'island') {
                    if (!this.boatQuestStarted) {
                        this.boatQuestStarted = true;
                        this.ui.showMessage('⛽ Моторная лодка, но бензина нет. Найдите канистру с бензином на острове!', 5000);
                        this.story.addQuest('find_fuel', '⛽ Найдите канистру с бензином');
                        this.ui.updateQuest('⛽ Найдите канистру с бензином на острове');
                        this.world.spawnCanister(() => this.handleInteraction('fuel'));
                    } else if (this.inventory.hasFuel()) {
                        this.startWinSequence();
                    } else {
                        this.ui.showMessage('⛽ Нужно найти бензин! Канистра где-то на острове.', 3000);
                    }
                }
                break;
            case 'fuel':
                this.inventory.addFuel();
                this.ui.showMessage('⛽ Вы нашли канистру с бензином! Возвращайтесь к лодке.', 3000);
                this.story.completeQuest('find_fuel');
                this.story.addQuest('use_fuel', '🛶 Заправьте лодку и уплывите');
                this.ui.updateQuest('🛶 Заправьте лодку бензином и уплывите');
                break;
        }
    }
    
    transitionToIsland() { /* без изменений */ }
    winGame() { /* без изменений */ }
    startWinSequence() { /* без изменений */ }
    updateWinSequence(deltaTime) { /* без изменений */ }
    startDeathSequence() { /* без изменений */ }
    updateDeathSequence(deltaTime) { /* без изменений */ }
    gameOver() { /* без изменений */ }
    updateMovement(deltaTime) { /* без изменений */ }
    animate() { /* без изменений */ }
    
    start() {
        this.init();
    }
}
