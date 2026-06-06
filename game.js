import * as THREE from 'three';
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
        this.gamePhase = 'basement'; // basement, island, escape
        
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
        
        // Set global reference for callbacks
        window.gameInstance = this;
        
        this.setupEventListeners();
        
        // Create world
        await this.world.createBasement();
        this.world.createInteractiveObjects(this.handleInteraction.bind(this));
        
        this.animate();
        this.showMenu();
        
        // Start story
        this.story.startGame();
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
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x332211);
        this.scene.add(ambientLight);
        
        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffcc88, 0.8);
        mainLight.position.set(10, 20, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        this.scene.add(mainLight);
        
        // Fill light
        const fillLight = new THREE.PointLight(0x6688aa, 0.3);
        fillLight.position.set(0, 5, 0);
        this.scene.add(fillLight);
        
        // Back rim light
        const rimLight = new THREE.PointLight(0xffaa66, 0.2);
        rimLight.position.set(-5, 3, -8);
        this.scene.add(rimLight);
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
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft') {
                this.player.sprint = false;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.gameActive) return;
            
            this.mouseX = e.movementX * 0.002;
            this.mouseY = e.movementY * 0.002;
            
            this.yaw -= this.mouseX;
            this.pitch -= this.mouseY;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
            
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
        });
        
        document.addEventListener('click', () => {
            if (this.gameActive) {
                document.body.style.cursor = 'none';
            }
        });
        
        // Lock pointer on click
        this.renderer.domElement.addEventListener('click', () => {
            if (this.gameActive) {
                this.renderer.domElement.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', lockChange);
        document.addEventListener('mozpointerlockchange', lockChange);
        
        const lockChange = () => {
            if (document.pointerLockElement === this.renderer.domElement) {
                document.body.style.cursor = 'none';
            } else {
                document.body.style.cursor = 'auto';
            }
        };
    }
    
    checkInteraction() {
        if (!this.gameActive) return;
        
        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(center, this.camera);
        
        const intersects = raycaster.intersectObjects(this.world.interactiveObjects);
        
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            if (obj.userData && obj.userData.onInteract) {
                obj.userData.onInteract();
            }
        }
    }
    
    handleInteraction(type, data) {
        switch(type) {
            case 'key':
                this.inventory.addItem('key', '🔑');
                this.story.completeQuest('find_key');
                this.ui.showMessage('Вы нашли ржавый ключ! Похоже, он открывает дверь наверх...', 3000);
                this.world.showExitDoor();
                break;
            case 'door':
                if (this.inventory.hasItem('key')) {
                    this.transitionToIsland();
                } else {
                    this.ui.showMessage('Дверь заперта. Нужно найти ключ!', 2000);
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
        this.ui.showMessage('Дверь открывается! Вы выходите на поверхность...', 2000);
        setTimeout(() => {
            this.gamePhase = 'island';
            this.world.createIsland();
            this.monster.activate();
            this.story.completeQuest('escape_basement');
            this.story.addQuest('find_boat', '🛶 Найдите лодку на острове и сбегите от монстра');
            this.ui.updateQuest('Найдите лодку на острове и сбегите от монстра! Он уже близко...');
            this.player.position.set(0, 1.6, 5);
            this.camera.position.copy(this.player.position);
        }, 2000);
    }
    
    winGame() {
        this.gameActive = false;
        this.ui.showWinScreen();
        document.exitPointerLock();
    }
    
    gameOver() {
        this.gameActive = false;
        this.ui.showGameOver();
        document.exitPointerLock();
    }
    
    updateMovement(deltaTime) {
        const speed = this.player.sprint ? 5.0 : 3.5;
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
        if (this.keys['KeyD']) move.add(right);
        if (this.keys['KeyA']) move.sub(right);
        
        if (move.length() > 0) move.normalize();
        move.multiplyScalar(moveDistance);
        this.player.position.add(move);
        
        // World boundaries
        const boundary = this.gamePhase === 'basement' ? 7.5 : 24;
        this.player.position.x = Math.max(-boundary, Math.min(boundary, this.player.position.x));
        this.player.position.z = Math.max(-boundary, Math.min(boundary, this.player.position.z));
        
        this.camera.position.copy(this.player.position);
        
        // Update monster AI
        if (this.gamePhase === 'island' && this.gameActive) {
            const caught = this.monster.update(this.player.position, deltaTime);
            if (caught) {
                this.gameOver();
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameActive) {
            const deltaTime = Math.min(0.033, 1/60);
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
        this.camera.position.copy(this.player.position);
        document.body.style.cursor = 'none';
        this.story.startGame();
    }
}

// Start the game
const game = new Game();
