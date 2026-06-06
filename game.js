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
        
        this.init();
    }
    
    async init() {
        this.setupRenderer();
        this.setupWorld();
        this.setupLighting();
        
        this.player = new Player(this.camera);
        this.monster = new Monster(this.scene);
        this.inventory = new Inventory();
        this.ui = new UIManager();
        this.story = new StoryManager(this.ui, this.inventory);
        
        window.gameInstance = this;
        
        this.setupEventListeners();
        
        await this.world.createBasement();
        this.world.createInteractiveObjects(this.handleInteraction.bind(this));
        
        // Загружаем FBX модель монстра
        await this.loadMonsterFBX();
        
        this.animate();
        this.showMenu();
        
        this.story.startGame();
    }
    
    async loadMonsterFBX() {
        const loader = new FBXLoader();
        const fbxPath = 'assets/models/monster.fbx';
        
        return new Promise((resolve) => {
            loader.load(fbxPath, (fbx) => {
                console.log('✅ FBX модель монстра успешно загружена!');
                this.fbxModel = fbx;
                
                // Удаляем стандартную модель монстра
                if (this.monster.mesh) {
                    this.scene.remove(this.monster.mesh);
                }
                
                // Настраиваем FBX модель
                fbx.scale.setScalar(0.02);
                fbx.position.copy(this.monster.position);
                fbx.castShadow = true;
                fbx.receiveShadow = true;
                
                // Создаем анимационный микшер
                this.fbxMixer = new THREE.AnimationMixer(fbx);
                
                // Воспроизводим анимацию
                if (fbx.animations && fbx.animations.length > 0) {
                    console.log(`🎬 Найдено ${fbx.animations.length} анимаций`);
                    const action = this.fbxMixer.clipAction(fbx.animations[0]);
                    action.play();
                    console.log('🎬 Анимация запущена');
                } else {
                    console.log('⚠️ Анимаций в FBX не найдено');
                }
                
                this.scene.add(fbx);
                this.monster.mesh = fbx;
                this.monster.useFBX = true;
                this.monster.mixer = this.fbxMixer;
                
                resolve(true);
            }, undefined, (error) => {
                console.warn('⚠️ Не удалось загрузить FBX модель, используется стандартная:', error);
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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
    }
    
    setupWorld() {
        this.world = new World(this.scene);
    }
    
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x332211);
        this.scene.add(ambientLight);
        
        const mainLight = new THREE.DirectionalLight(0xffcc88, 0.8);
        mainLight.position.set(10, 20, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 100;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        this.scene.add(mainLight);
        
        const fillLight = new THREE.PointLight(0x6688aa, 0.3);
        fillLight.position.set(0, 5, 0);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.PointLight(0xffaa66, 0.2);
        rimLight.position.set(-5, 3, -8);
        this.scene.add(rimLight);
        
        this.moonLight = new THREE.DirectionalLight(0x6688cc, 0.4);
        this.moonLight.position.set(-10, 15, -10);
        this.moonLight.castShadow = true;
        this.scene.add(this.moonLight);
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyE' && this.gameActive) {
                this.checkInteraction();
            }
            if (e.code === 'ShiftLeft') {
                this.player.sprint = true;
            }
            if (e.code === 'Space' && this.gameActive) {
                e.preventDefault();
                this.player.jump();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft') {
                this.player.sprint = false;
            }
        });
        
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
        
        // Исправленный pointer lock
        this.renderer.domElement.addEventListener('click', () => {
            if (this.gameActive && this.renderer.domElement) {
                try {
                    this.renderer.domElement.requestPointerLock();
                } catch (e) {
                    console.log('Pointer lock не поддерживается');
                }
            }
        });
        
        const lockChange = () => {
            if (document.pointerLockElement === this.renderer.domElement) {
                this.pointerLocked = true;
                document.body.style.cursor = 'none';
                console.log('🔒 Управление мышью активировано');
            } else {
                this.pointerLocked = false;
                document.body.style.cursor = 'auto';
                console.log('🔓 Управление мышью деактивировано');
            }
        };
        
        document.addEventListener('pointerlockchange', lockChange);
        document.addEventListener('mozpointerlockchange', lockChange);
        
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    checkInteraction() {
        if (!this.gameActive) return;
        
        const center = new THREE.Vector2(0, 0);
        this.raycaster.setFromCamera(center, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.world.interactiveObjects, true);
        
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && (!obj.userData || !obj.userData.onInteract)) {
                if (obj.parent && obj.parent.userData && obj.parent.userData.onInteract) {
                    obj = obj.parent;
                    break;
                }
                obj = obj.parent;
                if (!obj || obj === this.scene) break;
            }
            
            if (obj && obj.userData && obj.userData.onInteract) {
                obj.userData.onInteract();
            }
        }
    }
    
    handleInteraction(type, data) {
        switch(type) {
            case 'key':
                this.inventory.addItem('key', '🔑');
                this.story.completeQuest('find_key');
                this.ui.showMessage('🔑 Вы нашли ржавый ключ! Похоже, он открывает дверь наверх...', 3000);
                this.world.showExitDoor();
                break;
            case 'door':
                if (this.inventory.hasItem('key')) {
                    this.transitionToIsland();
                } else {
                    this.ui.showMessage('🔒 Дверь заперта. Нужно найти ключ!', 2000);
                }
                break;
            case 'boat':
                if (this.gamePhase === 'island') {
                    this.winGame();
                }
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
            this.ui.updateQuest('🛶 Найдите лодку на острове и сбегите от монстра! Он уже далеко, но услышал вас...');
            this.player.position.set(0, 1.6, 5);
            this.camera.position.copy(this.player.position);
            
            setTimeout(() => {
                if (this.gameActive) {
                    this.ui.showMessage('👹 Вы слышите рычание вдалеке... Монстр приближается!', 4000);
                }
            }, 1000);
        }, 2000);
    }
    
    winGame() {
        this.gameActive = false;
        this.ui.showWinScreen();
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    gameOver() {
        this.gameActive = false;
        this.ui.showGameOver();
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    updateMovement(deltaTime) {
        const speed = this.player.sprint ? 5.5 : 3.8;
        const moveDistance = speed * deltaTime;
        
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(new THREE.Vector3(0, 1, 0), forward);
        
        let move = new THREE.Vector3(0, 0, 0);
        
        if (this.keys['KeyW']) move.add(forward);
        if (this.keys['KeyS']) move.sub(forward);
        if (this.keys['KeyA']) move.sub(right);
        if (this.keys['KeyD']) move.add(right);
        
        if (move.length() > 0) move.normalize();
        move.multiplyScalar(moveDistance);
        
        this.player.position.add(move);
        
        const bounds = this.gamePhase === 'basement' 
            ? { minX: -8.5, maxX: 8.5, minZ: -8.5, maxZ: 8.5 }
            : { minX: -47, maxX: 47, minZ: -47, maxZ: 47 };
        this.player.updatePhysics(deltaTime, bounds);
        
        this.camera.position.copy(this.player.position);
        
        if (move.length() > 0.01 && this.player.isGrounded) {
            const bobAmount = Math.sin(Date.now() * 0.012) * 0.02;
            this.camera.position.y = this.player.position.y + bobAmount;
        } else {
            this.camera.position.y = this.player.position.y;
        }
        
        if (this.gamePhase === 'island' && this.gameActive) {
            const caught = this.monster.update(this.player.position, deltaTime);
            if (caught) {
                this.gameOver();
            }
            
            const distToMonster = this.player.position.distanceTo(this.monster.position);
            const monsterStatusElem = document.getElementById('monster-status');
            if (monsterStatusElem) {
                if (distToMonster < 8) {
                    monsterStatusElem.innerHTML = '⚠️ ОЧЕНЬ БЛИЗКО! ⚠️';
                    monsterStatusElem.style.color = '#ff0000';
                } else if (distToMonster < 15) {
                    monsterStatusElem.innerHTML = '🔴 БЛИЗКО';
                    monsterStatusElem.style.color = '#ff6600';
                } else if (distToMonster < 30) {
                    monsterStatusElem.innerHTML = '🟡 НЕДАЛЕКО';
                    monsterStatusElem.style.color = '#ffaa44';
                } else {
                    monsterStatusElem.innerHTML = '🟢 ДАЛЕКО';
                    monsterStatusElem.style.color = '#44ff44';
                }
            }
        }
        
        if (this.gamePhase === 'basement' && this.world.exitDoor) {
            const distToDoor = this.player.position.distanceTo(this.world.exitDoor.position);
            const distElem = document.getElementById('distance-indicator');
            if (distElem) {
                distElem.innerText = distToDoor.toFixed(1);
                if (distToDoor < 2) {
                    distElem.style.color = '#ffaa44';
                } else {
                    distElem.style.color = '#ffffff';
                }
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(0.033, 1/60);
        
        if (this.fbxMixer) {
            this.fbxMixer.update(deltaTime);
        }
        
        if (this.gameActive) {
            this.updateMovement(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    showMenu() {
        this.gameActive = false;
        this.ui.showMenu();
        const startBtn = document.getElementById('start-game');
        const restartBtn = document.getElementById('restart-game');
        
        if (startBtn) {
            startBtn.onclick = () => {
                this.startGame();
            };
        }
        if (restartBtn) {
            restartBtn.onclick = () => {
                location.reload();
            };
        }
    }
    
    startGame() {
        this.gameActive = true;
        this.gamePhase = 'basement';
        this.ui.hideMenu();
        this.player.position.set(0, 1.6, 0);
        this.player.velocity.set(0, 0, 0);
        this.camera.position.copy(this.player.position);
        this.story.startGame();
        
        this.monster.active = false;
        this.monster.position.set(35, 0, 30);
        if (this.monster.mesh) {
            this.monster.mesh.position.copy(this.monster.position);
        }
        
        setTimeout(() => {
            if (this.gameActive) {
                this.ui.showMessage('🎮 Используйте WASD для движения, мышь для осмотра, Shift для бега, Пробел для прыжка, E для взаимодействия', 5000);
            }
        }, 1000);
    }
}

const game = new Game();
