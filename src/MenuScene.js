import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6a8aad);
        this.scene.fog = new THREE.FogExp2(0x6a8aad, 0.008);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(8, 5, 12);
        this.camera.lookAt(0, 2, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.8;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.target.set(0, 2, 0);
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0x88aacc, 0.6);
        this.scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffdd99, 1.0);
        sunLight.position.set(10, 20, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);
        const fillLight = new THREE.PointLight(0x88aaff, 0.3);
        fillLight.position.set(0, 5, 0);
        this.scene.add(fillLight);
        
        // Земля
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Песок
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xddbb77, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(11, 13, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = true;
        this.scene.add(sandRing);
        
        // Простые пальмы
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        const palmPositions = [[-4, -0.5, 4], [5, -0.5, -3], [-3, -0.5, -4], [4, -0.5, 3]];
        palmPositions.forEach(pos => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.5, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.8, pos[2]);
            trunk.castShadow = true;
            const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 8), foliageMat);
            foliage1.position.set(pos[0], pos[1] + 1.7, pos[2]);
            foliage1.castShadow = true;
            const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 8), foliageMat);
            foliage2.position.set(pos[0], pos[1] + 2.5, pos[2]);
            foliage2.castShadow = true;
            this.scene.add(trunk, foliage1, foliage2);
        });
        
        // Дом
        const houseMat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
        const house = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3, 3.5), houseMat);
        house.position.set(0, 0.2, 0);
        house.castShadow = true;
        house.receiveShadow = true;
        this.scene.add(house);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xcc6644 });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.3, 4), roofMat);
        roof.position.set(0, 1.8, 0);
        roof.castShadow = true;
        this.scene.add(roof);
        
        // Загрузка модели Эпштейна для танца
        const loader = new FBXLoader();
        loader.load('assets/models/flair.fbx', (fbx) => {
            this.epsteinModel = fbx;
            fbx.scale.setScalar(0.045);
            fbx.position.set(1.5, 0, 1.5);
            fbx.rotation.y = -Math.PI / 4;
            fbx.castShadow = true;
            fbx.receiveShadow = true;
            this.scene.add(fbx);
            
            if (fbx.animations && fbx.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(fbx);
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
                console.log('🎬 Эпштейн танцует!');
            }
        }, undefined, (error) => {
            console.warn('⚠️ Модель flair.fbx не загружена, создаю заглушку', error);
            const geometry = new THREE.SphereGeometry(0.7, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: 0xffaa44 });
            const dummy = new THREE.Mesh(geometry, material);
            dummy.position.set(1.5, 0.7, 1.5);
            dummy.castShadow = true;
            this.scene.add(dummy);
        });
        
        // Анимация (если нет анимации в FBX)
        this.animateEpstein = () => {
            if (this.mixer) {
                this.mixer.update(this.clock.getDelta());
            } else if (this.epsteinModel) {
                const time = Date.now() * 0.003;
                this.epsteinModel.rotation.y = Math.sin(time) * 0.3;
                this.epsteinModel.position.y = 0 + Math.sin(time * 2) * 0.05;
            }
        };
        
        // Музыка
        this.audio = new Audio('assets/sounds/menu.mp3');
        this.audio.loop = true;
        this.audio.volume = 0.6;
        this.audio.play().catch(e => console.log('Audio play error:', e));
        
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
