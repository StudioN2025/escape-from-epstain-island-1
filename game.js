import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Player } from './src/Player.js';
import { Monster } from './src/Monster.js';   // класс Monster переименовывать не будем, но внутри поменяем тексты
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
        this.epstein = null;        // вместо monster
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
        // Не вызываем init здесь, ждём start()
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
        console.log('💾 Настройки сохранены');
        if (this.world) {
            this.world.settings.brightness = this.settings.brightness;
            this.world.setupSunLighting();
        }
    }
    
    updateLoadingProgress(percent, status) {
        this.loadingProgress = percent;
        // Можно добавить индикатор в DOM, если нужно
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
        this.epstein = new Monster(this.scene); // но внутри Monster.js заменим название класса на Epstein? Пока оставим как есть, только тексты.
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
            this.startGame();
        }, 500);
        this.animate();
        this.story.startGame();
    }
    
    async loadEpsteinFBX() {
        const loader = new FBXLoader();
        const fbxPath = 'assets/models/epstein_run.fbx'; // модель бегущего Эпштейна
        return new Promise((resolve) => {
            loader.load(fbxPath, (fbx) => {
                console.log('✅ Модель Эпштейна загружена');
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
                console.warn('⚠️ Модель epstein_run.fbx не найдена, использую стандартную сферу');
                resolve(false);
            });
        });
    }
    
    setupRenderer() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050b1a);
        this.scene.fog = new THREE.FogExp2(0x050b1a, 0.03);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.camera.position.set(0, 1.6, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = this.settings.shadows;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupWorld() {
        this.world = new World(this.scene, this.settings);
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x332211);
        this.scene.add(ambient);
        const main = new THREE.DirectionalLight(0xffcc88, 0.8);
        main.position.set(10, 20, 5);
        main.castShadow = this.settings.shadows;
        this.scene.add(main);
        const fill = new THREE.PointLight(0x6688aa, 0.3);
        fill.position.set(0, 5, 0);
        this.scene.add(fill);
        const rim = new THREE.PointLight(0xffaa66, 0.2);
        rim.position.set(-5, 3, -8);
        this.scene.add(rim);
        this.moonLight = new THREE.DirectionalLight(0x6688cc, 0.4);
        this.moonLight.position.set(-10, 15, -10);
        this.moonLight.castShadow = this.settings.shadows;
        this.scene.add(this.moonLight);
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyE' && this.gameActive) this.checkInteraction();
            if (e.code === 'KeyF') { e.preventDefault(); this.toggleInventory(); }
            if (e.code === 'Space' && this.gameActive) { e.preventDefault(); this.player.jump(); }
        });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        document.addEventListener('mousemove', (e) => {
            if (!this.gameActive || !this.pointerLocked) return;
            this.mouseX = e.movementX * 0.002;
            this.mouseY = e.movementY * 0.002;
            this.yaw -= this.mouseX;
            this.pitch -= this.mouseY;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
        });
        this.renderer.domElement.addEventListener('click', () => {
            if (this.gameActive && document.pointerLockElement !== this.renderer.domElement) {
                try { this.renderer.domElement.requestPointerLock(); } catch(e) {}
            }
        });
        const lockChange = () => {
            this.pointerLocked = (document.pointerLockElement === this.renderer.domElement);
            document.body.style.cursor = this.pointerLocked ? 'none' : 'auto';
        };
        document.addEventListener('pointerlockchange', lockChange);
        document.addEventListener('mozpointerlockchange', lockChange);
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        const inv = document.getElementById('inventory');
        if (inv) inv.style.display = this.inventoryOpen ? 'flex' : 'none';
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    checkInteraction() {
        if (!this.gameActive) return;
        const center = new THREE.Vector2(0, 0);
        this.raycaster.setFromCamera(center, this.camera);
        const intersects = this.raycaster.intersectObjects(this.world.interactiveObjects, true);
        if (intersects.length) {
            let obj = intersects[0].object;
            while (obj && (!obj.userData || !obj.userData.onInteract)) {
                if (obj.parent?.userData?.onInteract) { obj = obj.parent; break; }
                obj = obj.parent;
                if (!obj || obj === this.scene) break;
            }
            if (obj?.userData?.onInteract) obj.userData.onInteract();
        }
    }
    
    handleInteraction(type, data) {
        switch(type) {
            case 'key':
                this.inventory.addItem('key', '🔑');
                this.story.completeQuest('find_key');
                this.ui.showMessage('🔑 Вы нашли ключ!', 3000);
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
    
    transitionToIsland() {
        this.ui.showMessage('🚪 Дверь открывается! Вы выходите на поверхность...', 2000);
        setTimeout(() => {
            this.gamePhase = 'island';
            this.world.createIsland();
            this.epstein.activate();
            this.story.completeQuest('escape_basement');
            this.story.addQuest('find_boat', '🛶 Найдите лодку на острове');
            this.ui.updateQuest('🛶 Найдите лодку на острове');
            this.player.position.set(0, 1.6, 5);
            this.camera.position.copy(this.player.position);
            setTimeout(() => {
                if (this.gameActive) this.ui.showMessage('👔 Вы слышите шаги... Эпштейн приближается!', 4000);
            }, 1000);
        }, 2000);
    }
    
    winGame() {
        this.gameActive = false;
        this.ui.showWinScreen();
        if (document.exitPointerLock) document.exitPointerLock();
        document.getElementById('game-ui')?.classList.add('hidden');
        const overlay = document.getElementById('win-overlay');
        if (overlay) overlay.style.opacity = '0';
    }
    
    startWinSequence() {
        if (this.isWinning) return;
        this.isWinning = true;
        this.gameActive = false;
        this.originalCameraPos = this.camera.position.clone();
        this.winTimer = 0;
        if (this.winSound) {
            this.winSound.currentTime = 0;
            this.winSound.play().catch(e => console.log('Audio play error:', e));
        }
        if (document.exitPointerLock) document.exitPointerLock();
        const overlay = document.getElementById('win-overlay');
        if (overlay) overlay.style.opacity = '0';
        document.getElementById('game-ui')?.classList.add('hidden');
    }
    
    updateWinSequence(deltaTime) {
        this.winTimer += deltaTime;
        const t = Math.min(1.0, this.winTimer / this.winDuration);
        const targetPos = new THREE.Vector3(0, 20, 30);
        this.camera.position.lerpVectors(this.originalCameraPos, targetPos, t);
        this.camera.lookAt(0, 0, 0);
        const overlay = document.getElementById('win-overlay');
        if (overlay) overlay.style.opacity = Math.min(1.0, t * 1.5);
        if (t >= 1.0) {
            this.isWinning = false;
            this.winGame();
        }
    }
    
    startDeathSequence() {
        if (this.isDying) return;
        this.isDying = true;
        this.gameActive = false;
        this.originalCameraPos = this.camera.position.clone();
        this.deathTimer = 0;
        const overlay = document.getElementById('death-overlay');
        if (overlay) overlay.style.opacity = '0';
        if (this.deathSound) {
            this.deathSound.currentTime = 0;
            this.deathSound.play().catch(e => console.log('Audio play error:', e));
        }
        if (document.exitPointerLock) document.exitPointerLock();
    }
    
    updateDeathSequence(deltaTime) {
        this.deathTimer += deltaTime;
        const t = Math.min(1.0, this.deathTimer / this.deathDuration);
        const epsteinPos = this.epstein.position.clone();
        epsteinPos.y += 1.0;
        const targetCamPos = epsteinPos.clone();
        targetCamPos.z += 1.2;
        targetCamPos.x += 0.3;
        targetCamPos.y = epsteinPos.y + 0.5;
        this.camera.position.lerpVectors(this.originalCameraPos, targetCamPos, t);
        this.camera.lookAt(epsteinPos);
        const overlay = document.getElementById('death-overlay');
        if (overlay) overlay.style.opacity = Math.min(1.0, t * 1.5);
        if (t >= 1.0) {
            this.isDying = false;
            this.gameOver();
        }
    }
    
    gameOver() {
        const overlay = document.getElementById('death-overlay');
        if (overlay) overlay.style.opacity = '1';
        this.ui.showGameOver();
        document.getElementById('game-ui')?.classList.add('hidden');
    }
    
    updateMovement(deltaTime) {
        if (this.isDying || this.isWinning) return;
        
        let speed = 3.8;
        if (this.keys['ShiftLeft'] && this.stamina > 0 && this.gameActive) {
            speed = 5.5;
            this.stamina = Math.max(0, this.stamina - deltaTime * 25);
        } else if (!this.keys['ShiftLeft']) {
            this.stamina = Math.min(this.maxStamina, this.stamina + deltaTime * 15);
        }
        const moveDist = speed * deltaTime;
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(new THREE.Vector3(0, 1, 0), forward);
        let move = new THREE.Vector3(0,0,0);
        if (this.keys['KeyW']) move.add(forward);
        if (this.keys['KeyS']) move.sub(forward);
        if (this.keys['KeyA']) move.add(right);
        if (this.keys['KeyD']) move.sub(right);
        if (move.length()) move.normalize();
        move.multiplyScalar(moveDist);
        
        let newPos = this.player.position.clone().add(move);
        if (this.world && this.world.collidables && this.world.collidables.length > 0) {
            newPos = this.world.resolveCollision(newPos);
        }
        this.player.position.copy(newPos);
        
        const bounds = this.gamePhase === 'basement' ? { minX: -8.5, maxX: 8.5, minZ: -8.5, maxZ: 8.5 } : { minX: -47, maxX: 47, minZ: -47, maxZ: 47 };
        this.player.updatePhysics(deltaTime, bounds);
        this.camera.position.copy(this.player.position);
        
        if (this.world && this.gamePhase === 'island') this.world.updatePlayerPosition(this.player.position);
        
        if (move.length() > 0.01 && this.player.isGrounded) {
            this.camera.position.y = this.player.position.y + Math.sin(Date.now() * 0.012) * 0.02;
        } else {
            this.camera.position.y = this.player.position.y;
        }
        
        if (this.gamePhase === 'island' && this.gameActive && !this.isDying && !this.isWinning) {
            const caught = this.epstein.update(this.player.position, deltaTime);
            if (caught) {
                this.startDeathSequence();
                return;
            }
            const d = this.player.position.distanceTo(this.epstein.position);
            const el = document.getElementById('monster-status');
            if (el) {
                if (d < 5) { el.innerHTML = '⚠️ ЭПШТЕЙН РЯДОМ! ⚠️'; el.style.color = '#ff0000'; }
                else if (d < 10) { el.innerHTML = '🔴 ЭПШТЕЙН БЛИЗКО'; el.style.color = '#ff6600'; }
                else if (d < 20) { el.innerHTML = '🟡 ЭПШТЕЙН НЕДАЛЕКО'; el.style.color = '#ffaa44'; }
                else { el.innerHTML = '🟢 ЭПШТЕЙН ДАЛЕКО'; el.style.color = '#44ff44'; }
            }
        }
        
        if (this.gamePhase === 'basement' && this.world.exitDoor) {
            const d = this.player.position.distanceTo(this.world.exitDoor.position);
            const de = document.getElementById('distance-indicator');
            if (de) { de.innerText = d.toFixed(1); de.style.color = d < 2 ? '#ffaa44' : '#fff'; }
        }
        
        const staminaDiv = document.getElementById('stamina-value');
        if (staminaDiv) staminaDiv.style.width = `${(this.stamina / this.maxStamina) * 100}%`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(0.033, 1/60);
        if (this.fbxMixer) this.fbxMixer.update(delta);
        
        if (this.isWinning) {
            this.updateWinSequence(delta);
        } else if (this.isDying) {
            this.updateDeathSequence(delta);
        } else if (this.gameActive) {
            this.updateMovement(delta);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    start() {
        this.init();
    }
}
