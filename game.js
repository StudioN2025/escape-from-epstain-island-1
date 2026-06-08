import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Player } from './src/Player.js';
import { Monster } from './src/Monster.js';
import { World } from './src/World.js';
import { Inventory } from './src/Inventory.js';
import { StoryManager } from './src/StoryManager.js';
import { UIManager } from './src/UI.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.monster = null;
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
        
        // Стамина
        this.stamina = 100;
        this.maxStamina = 100;
        this.inventoryOpen = false;
        
        // Настройки
        this.settings = {
            shadows: true,
            brightness: 0.55
        };
        
        this.loadSettings();
        this.init();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch(e) {}
        }
        
        setTimeout(() => {
            const shadowsToggle = document.getElementById('shadows-toggle');
            const brightnessSlider = document.getElementById('brightness-slider');
            if (shadowsToggle) shadowsToggle.checked = this.settings.shadows;
            if (brightnessSlider) brightnessSlider.value = this.settings.brightness;
        }, 100);
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
        const loadingBar = document.getElementById('loading-bar');
        const loadingPercent = document.getElementById('loading-percent');
        const loadingStatus = document.getElementById('loading-status');
        
        if (loadingBar) loadingBar.style.width = percent + '%';
        if (loadingPercent) loadingPercent.innerText = percent + '%';
        if (loadingStatus) loadingStatus.innerText = status;
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
        
        this.updateLoadingProgress(45, 'Загрузка монстра...');
        this.monster = new Monster(this.scene);
        
        this.updateLoadingProgress(55, 'Загрузка инвентаря...');
        this.inventory = new Inventory();
        
        this.updateLoadingProgress(60, 'Загрузка интерфейса...');
        this.ui = new UIManager();
        
        this.updateLoadingProgress(65, 'Загрузка сюжета...');
        this.story = new StoryManager(this.ui, this.inventory);
        
        window.gameInstance = this;
        
        this.updateLoadingProgress(70, 'Настройка управления...');
        this.setupEventListeners();
        this.setupSettingsUI();
        
        this.updateLoadingProgress(75, 'Создание подвала...');
        await this.world.createBasement();
        
        this.updateLoadingProgress(85, 'Создание объектов...');
        this.world.createInteractiveObjects(this.handleInteraction.bind(this));
        
        this.updateLoadingProgress(90, 'Загрузка моделей монстра...');
        await this.loadMonsterFBX();
        
        this.updateLoadingProgress(100, 'Готово!');
        
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    this.showMenu();
                }, 500);
            }
        }, 500);
        
        this.animate();
        this.story.startGame();
    }
    
    setupSettingsUI() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsScreen = document.getElementById('settings-screen');
        const settingsSave = document.getElementById('settings-save');
        const settingsCancel = document.getElementById('settings-cancel');
        
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                settingsScreen.classList.remove('hidden');
            };
        }
        
        if (settingsSave) {
            settingsSave.onclick = () => {
                this.settings.shadows = document.getElementById('shadows-toggle').checked;
                this.settings.brightness = parseFloat(document.getElementById('brightness-slider').value);
                this.saveSettings();
                settingsScreen.classList.add('hidden');
                alert('Настройки сохранены. Перезапустите игру для применения теней, яркость изменится сразу.');
                location.reload();
            };
        }
        
        if (settingsCancel) {
            settingsCancel.onclick = () => {
                settingsScreen.classList.add('hidden');
                document.getElementById('shadows-toggle').checked = this.settings.shadows;
                document.getElementById('brightness-slider').value = this.settings.brightness;
            };
        }
    }
    
    async loadMonsterFBX() {
        const loader = new FBXLoader();
        const fbxPath = 'assets/models/monster.fbx';
        
        return new Promise((resolve) => {
            loader.load(fbxPath, (fbx) => {
                console.log('✅ FBX модель монстра успешно загружена!');
                if (this.monster.mesh) {
                    this.scene.remove(this.monster.mesh);
                }
                fbx.scale.setScalar(0.02);
                fbx.position.copy(this.monster.position);
                fbx.castShadow = this.settings.shadows;
                fbx.receiveShadow = this.settings.shadows;
                this.fbxMixer = new THREE.AnimationMixer(fbx);
                if (fbx.animations && fbx.animations.length > 0) {
                    console.log(`🎬 Найдено ${fbx.animations.length} анимаций`);
                    const action = this.fbxMixer.clipAction(fbx.animations[0]);
                    action.play();
                }
                this.scene.add(fbx);
                this.monster.mesh = fbx;
                this.monster.useFBX = true;
                this.monster.mixer = this.fbxMixer;
                resolve(true);
            }, (xhr) => {
                if (xhr.total) {
                    const percent = Math.floor((xhr.loaded / xhr.total) * 100);
                    this.updateLoadingProgress(90 + Math.floor(percent * 0.1), `Загрузка модели: ${percent}%`);
                }
            }, (error) => {
                console.warn('⚠️ Не удалось загрузить FBX модель, используется стандартная');
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
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupWorld() {
        this.world = new World(this.scene, this.settings);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x332211);
        this.scene.add(ambientLight);
        const mainLight = new THREE.DirectionalLight(0xffcc88, 0.8);
        mainLight.position.set(10, 20, 5);
        mainLight.castShadow = this.settings.shadows;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        const fillLight = new THREE.PointLight(0x6688aa, 0.3);
        fillLight.position.set(0, 5, 0);
        this.scene.add(fillLight);
        const rimLight = new THREE.PointLight(0xffaa66, 0.2);
        rimLight.position.set(-5, 3, -8);
        this.scene.add(rimLight);
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
        
        // Исправленный захват указателя — без ошибок SecurityError
        this.renderer.domElement.addEventListener('click', () => {
            if (this.gameActive && this.renderer.domElement && document.pointerLockElement !== this.renderer.domElement) {
                try {
                    this.renderer.domElement.requestPointerLock();
                } catch (e) { console.log('Pointer lock error:', e); }
            }
        });
        
        const lockChange = () => {
            if (document.pointerLockElement === this.renderer.domElement) {
                this.pointerLocked = true;
                document.body.style.cursor = 'none';
            } else {
                this.pointerLocked = false;
                document.body.style.cursor = 'auto';
            }
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
                this.ui.showMessage('🔑 Вы нашли ржавый ключ!', 3000);
                this.world.showExitDoor();
                break;
            case 'door':
                if (this.inventory.hasItem('key')) this.transitionToIsland();
                else this.ui.showMessage('🔒 Дверь заперта. Нужно найти ключ!', 2000);
                break;
            case 'boat':
                if (this.gamePhase === 'island') this.winGame();
                break;
        }
    }
    
    transitionToIsland() {
        this.ui.showMessage('🚪 Дверь открывается! Вы выходите на поверхность...', 2000);
        setTimeout(() => {
            this.gamePhase = 'island';
            this.world.createIsland();
            this.monster.activate();
            this.story.completeQuest('escape_basement');
            this.story.addQuest('find_boat', '🛶 Найдите лодку на острове и сбегите от монстра');
            this.ui.updateQuest('🛶 Найдите лодку на острове и сбегите от монстра!');
            this.player.position.set(0, 1.6, 5);
            this.camera.position.copy(this.player.position);
            setTimeout(() => {
                if (this.gameActive) this.ui.showMessage('👹 Вы слышите рычание вдалеке... Монстр приближается!', 4000);
            }, 1000);
        }, 2000);
    }
    
    winGame() {
        this.gameActive = false;
        this.ui.showWinScreen();
        if (document.exitPointerLock) document.exitPointerLock();
        document.getElementById('game-ui')?.classList.add('hidden');
    }
    
    gameOver() {
        this.gameActive = false;
        this.ui.showGameOver();
        if (document.exitPointerLock) document.exitPointerLock();
        document.getElementById('game-ui')?.classList.add('hidden');
    }
    
    updateMovement(deltaTime) {
        let speed = 3.8;
        let isSprinting = false;
        if (this.keys['ShiftLeft'] && this.stamina > 0 && this.gameActive) {
            speed = 5.5;
            isSprinting = true;
            this.stamina = Math.max(0, this.stamina - deltaTime * 25);
        } else if (!this.keys['ShiftLeft']) {
            this.stamina = Math.min(this.maxStamina, this.stamina + deltaTime * 15);
        }
        const moveDistance = speed * deltaTime;
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
        if (move.length() > 0) move.normalize();
        move.multiplyScalar(moveDistance);
        this.player.position.add(move);
        const bounds = this.gamePhase === 'basement' ? { minX: -8.5, maxX: 8.5, minZ: -8.5, maxZ: 8.5 } : { minX: -47, maxX: 47, minZ: -47, maxZ: 47 };
        this.player.updatePhysics(deltaTime, bounds);
        this.camera.position.copy(this.player.position);
        if (this.world && this.gamePhase === 'island') this.world.updatePlayerPosition(this.player.position);
        if (move.length() > 0.01 && this.player.isGrounded) {
            this.camera.position.y = this.player.position.y + Math.sin(Date.now() * 0.012) * 0.02;
        } else {
            this.camera.position.y = this.player.position.y;
        }
        if (this.gamePhase === 'island' && this.gameActive) {
            const caught = this.monster.update(this.player.position, deltaTime);
            if (caught) { this.gameOver(); return; }
            const d = this.player.position.distanceTo(this.monster.position);
            const el = document.getElementById('monster-status');
            if (el) {
                if (d < 5) { el.innerHTML = '⚠️ ОЧЕНЬ БЛИЗКО! ⚠️'; el.style.color = '#ff0000'; }
                else if (d < 10) { el.innerHTML = '🔴 ОПАСНО!'; el.style.color = '#ff6600'; }
                else if (d < 20) { el.innerHTML = '🟡 НЕДАЛЕКО'; el.style.color = '#ffaa44'; }
                else { el.innerHTML = '🟢 ДАЛЕКО'; el.style.color = '#44ff44'; }
            }
        }
        if (this.gamePhase === 'basement' && this.world.exitDoor) {
            const d = this.player.position.distanceTo(this.world.exitDoor.position);
            const de = document.getElementById('distance-indicator');
            if (de) { de.innerText = d.toFixed(1); de.style.color = d < 2 ? '#ffaa44' : '#ffffff'; }
        }
        const staminaDiv = document.getElementById('stamina-value');
        if (staminaDiv) staminaDiv.style.width = `${(this.stamina / this.maxStamina) * 100}%`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(0.033, 1/60);
        if (this.fbxMixer) this.fbxMixer.update(delta);
        if (this.gameActive) this.updateMovement(delta);
        this.renderer.render(this.scene, this.camera);
    }
    
    showMenu() {
        this.gameActive = false;
        this.ui.showMenu();
        document.getElementById('game-ui')?.classList.add('hidden');
        const start = document.getElementById('start-game');
        const restart = document.getElementById('restart-game');
        if (start) start.onclick = () => this.startGame();
        if (restart) restart.onclick = () => location.reload();
        document.getElementById('retry-btn')?.addEventListener('click', () => location.reload());
        document.getElementById('play-again')?.addEventListener('click', () => location.reload());
    }
    
    startGame() {
        this.gameActive = true;
        this.gamePhase = 'basement';
        this.ui.hideMenu();
        document.getElementById('game-ui')?.classList.remove('hidden');
        this.player.position.set(0, 1.6, 0);
        this.player.velocity.set(0, 0, 0);
        this.camera.position.copy(this.player.position);
        this.story.startGame();
        this.monster.active = false;
        this.monster.position.set(35, 0, 30);
        if (this.monster.mesh) this.monster.mesh.position.copy(this.monster.position);
        this.stamina = this.maxStamina;
        setTimeout(() => {
            if (this.gameActive) this.ui.showMessage('WASD – движение, мышь – осмотр, Shift – бег, Пробел – прыжок, E – взять, F – инвентарь', 5000);
        }, 1000);
    }
}

const game = new Game();
setTimeout(() => {
    if (game.monster?.mesh) console.log('✅ Монстр готов');
}, 2000);
