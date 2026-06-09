import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './World.js';

export class MenuScene {
    constructor(onStartCallback) {
        this.onStart = onStartCallback;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mixer = null;
        this.audio = null;
        this.epsteinModel = null;
        this.clock = new THREE.Clock();
        this.startButton = null;
        this.animationId = null;
        this.world = null; // для создания острова
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6a8aad);
        this.scene.fog = new THREE.FogExp2(0x6a8aad, 0.003);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(12, 8, 15);
        this.camera.lookAt(0, 2, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.enableZoom = true;
        this.controls.target.set(0, 2, 0);
        
        // Создаём остров через World (без подвала и монстра, только остров)
        this.world = new World(this.scene, { shadows: true, brightness: 0.55 });
        this.world.createIsland();   // создаёт остров с домом, пальмами, костром, лодкой
        
        // Но лодка не нужна в меню, можно её скрыть, но не обязательно
        
        // Загружаем танцующего Эпштейна
        const loader = new FBXLoader();
        loader.load('assets/models/dance.fbx', (fbx) => {
            this.epsteinModel = fbx;
            fbx.scale.setScalar(0.045);
            fbx.position.set(0, 0, 2); // перед домом
            fbx.rotation.y = -Math.PI / 4;
            fbx.castShadow = true;
            this.scene.add(fbx);
            if (fbx.animations && fbx.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(fbx);
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
                console.log('🎬 Эпштейн танцует!');
            }
        }, undefined, (error) => {
            console.warn('⚠️ Модель dance.fbx не загружена, создаю заглушку', error);
            const geometry = new THREE.SphereGeometry(0.7, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: 0xffaa44 });
            const dummy = new THREE.Mesh(geometry, material);
            dummy.position.set(0, 0.7, 2);
            dummy.castShadow = true;
            this.scene.add(dummy);
        });
        
        // Анимация для заглушки
        this.animateEpstein = () => {
            if (this.mixer) this.mixer.update(this.clock.getDelta());
            else if (this.epsteinModel) {
                const time = Date.now() * 0.003;
                this.epsteinModel.rotation.y = Math.sin(time) * 0.3;
                this.epsteinModel.position.y = 0 + Math.sin(time * 2) * 0.05;
            }
        };
        
        // Музыка
        this.audio = new Audio('assets/sounds/menu.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.6;
        
        this.createStartButton();
        this.animate();
    }
    
    createStartButton() {
        this.startButton = document.createElement('button');
        this.startButton.textContent = '▶ НАЧАТЬ ИГРУ НА ОСТРОВЕ ЭПШТЕЙНА';
        this.startButton.style.position = 'absolute';
        this.startButton.style.bottom = '20%';
        this.startButton.style.left = '50%';
        this.startButton.style.transform = 'translateX(-50%)';
        this.startButton.style.padding = '15px 40px';
        this.startButton.style.fontSize = '20px';
        this.startButton.style.fontWeight = 'bold';
        this.startButton.style.backgroundColor = '#ffaa44';
        this.startButton.style.border = 'none';
        this.startButton.style.borderRadius = '10px';
        this.startButton.style.cursor = 'pointer';
        this.startButton.style.fontFamily = 'monospace';
        this.startButton.style.zIndex = '1000';
        this.startButton.style.whiteSpace = 'nowrap';
        this.startButton.onmouseenter = () => this.startButton.style.transform = 'translateX(-50%) scale(1.05)';
        this.startButton.onmouseleave = () => this.startButton.style.transform = 'translateX(-50%) scale(1)';
        this.startButton.onclick = () => {
            if (this.audio) this.audio.play().catch(e => console.log('Audio play error:', e));
            this.dispose();
            if (this.onStart) this.onStart();
        };
        document.body.appendChild(this.startButton);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.animateEpstein();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        if (this.startButton) this.startButton.remove();
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        if (this.mixer) this.mixer.stopAllAction();
        this.scene = null;
        this.camera = null;
        this.controls = null;
        console.log('🎬 Меню уничтожено');
    }
}
