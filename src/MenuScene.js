// MenuScene.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class MenuScene {
    constructor(assetManager, onStartCallback) {
        this.assetManager = assetManager;
        this.onStart = onStartCallback;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mixer = null;
        this.epsteinModel = null;
        this.clock = new THREE.Clock();
        this.startButton = null;
        this.animationId = null;
        this.audio = null;
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
        this.controls.autoRotateSpeed = 0.6;
        this.controls.enableZoom = true;
        this.controls.target.set(0, 2, 0);
        
        // Создаём красивый остров для меню
        this.createMenuIsland();
        
        // Загружаем танцующего Эпштейна из flair.fbx
        this.loadFlairEpstein();
        
        // Музыка из AssetManager
        const menuSound = this.assetManager.getSound('menu');
        if (menuSound) {
            this.audio = menuSound;
            this.audio.loop = true;
            this.audio.volume = 0.5;
            this.audio.currentTime = 0;
            this.audio.play().catch(e => console.log('Audio play error:', e));
        }
        
        this.createStartButton();
        this.animate();
    }
    
    createMenuIsland() {
        // Текстуры
        const grassTex = this.assetManager.getTexture('grass');
        const sandTex = this.assetManager.getTexture('sand');
        
        // Земля
        const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Песок
        const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(45, 50, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = true;
        this.scene.add(sandRing);
        
        // Холмы
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x5a8a4a });
        for(let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 10 + Math.random() * 35;
            const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.4, 8), hillMat);
            hill.position.set(Math.cos(angle) * r, -0.35, Math.sin(angle) * r);
            hill.castShadow = true;
            this.scene.add(hill);
        }
        
        // Пальмы
        const palmModel = this.assetManager.getModel('palm');
        if (palmModel) {
            const positions = [];
            for(let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 12 + Math.random() * 36;
                positions.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, scale: 0.7 + Math.random() * 0.6 });
            }
            const box = new THREE.Box3().setFromObject(palmModel);
            const baseScale = 4.0 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            positions.forEach(p => {
                const tree = palmModel.clone();
                const s = baseScale * p.scale;
                tree.scale.setScalar(s);
                tree.position.set(p.x, -0.5, p.z);
                tree.castShadow = true;
                this.scene.add(tree);
            });
            console.log('🌴 Пальмы добавлены в меню');
        }
        
        // Дом
        const houseModel = this.assetManager.getModel('house');
        if (houseModel) {
            const box = new THREE.Box3().setFromObject(houseModel);
            const size = box.getSize(new THREE.Vector3());
            const targetSize = 10.0;
            const scale = targetSize / Math.max(size.x, size.y, size.z);
            houseModel.scale.setScalar(scale);
            houseModel.position.set(0, 2.0, 0);
            houseModel.castShadow = true;
            houseModel.receiveShadow = true;
            this.scene.add(houseModel);
            console.log('🏠 Дом добавлен в меню');
        }
        
        // Костёр с анимацией огня
        const campfireModel = this.assetManager.getModel('campfire');
        if (campfireModel) {
            const box = new THREE.Box3().setFromObject(campfireModel);
            const scale = 0.7 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            campfireModel.scale.setScalar(scale);
            campfireModel.position.set(0, -0.2, 0);
            campfireModel.castShadow = true;
            this.scene.add(campfireModel);
            const fireLight = new THREE.PointLight(0xff6600, 0.45, 12);
            fireLight.position.set(0, 0.4, 0);
            this.scene.add(fireLight);
            const animateFire = () => {
                requestAnimationFrame(animateFire);
                if(fireLight.parent) fireLight.intensity = 0.35 + Math.sin(Date.now() * 0.01) * 0.2;
            };
            animateFire();
            console.log('🔥 Костёр добавлен в меню');
        }
        
        // Лодка
        const boatModel = this.assetManager.getModel('boat');
        if (boatModel) {
            const box = new THREE.Box3().setFromObject(boatModel);
            const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            const scale = 2.5 / maxDim;
            boatModel.scale.setScalar(scale);
            boatModel.position.set(42, -0.15, 38);
            boatModel.castShadow = true;
            this.scene.add(boatModel);
            console.log('🛶 Лодка добавлена в меню');
        }
        
        // Вода
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 });
        const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), waterMat);
        waterPlane.rotation.x = -Math.PI / 2;
        waterPlane.position.y = -0.6;
        waterPlane.receiveShadow = false;
        this.scene.add(waterPlane);
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0x88aacc, 0.5);
        this.scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffdd99, 0.9);
        sunLight.position.set(30, 30, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);
        
        // Облака
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, transparent: true, opacity: 0.7 });
        const cloudPositions = [[-15, 12, -10], [10, 14, -5], [0, 13, -15], [20, 11, 0], [-20, 13, 5]];
        cloudPositions.forEach(pos => {
            const cloudGroup = new THREE.Group();
            const parts = [0.8, 0.6, 0.7, 0.5];
            parts.forEach((size, idx) => {
                const part = new THREE.Mesh(new THREE.SphereGeometry(size, 7, 7), cloudMat);
                part.position.set(idx * 0.8 - 1.2, Math.sin(idx) * 0.3, idx * 0.5 - 0.8);
                part.castShadow = false;
                cloudGroup.add(part);
            });
            cloudGroup.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(cloudGroup);
        });
        
        console.log('🏝️ Остров для меню создан');
    }
    
    loadFlairEpstein() {
        // Используем ТОЛЬКО flair.fbx для меню
        const flairModel = this.assetManager.getModel('flair');
        if (flairModel) {
            this.epsteinModel = flairModel;
            // Настройка размера и позиции
            this.epsteinModel.scale.setScalar(0.045);
            this.epsteinModel.position.set(0, 0, 3.5);
            this.epsteinModel.rotation.y = -Math.PI / 4;
            this.epsteinModel.castShadow = true;
            this.scene.add(this.epsteinModel);
            
            // Запускаем анимацию, если есть
            if (this.epsteinModel.animations && this.epsteinModel.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.epsteinModel);
                const action = this.mixer.clipAction(this.epsteinModel.animations[0]);
                action.play();
                console.log('🕺 Эпштейн из flair.fbx жестко денсит в меню!');
            } else {
                console.warn('⚠️ Анимация в flair.fbx не найдена, делаем простую покачку');
                this.simpleDanceAnimation = () => {
                    if (this.epsteinModel) {
                        const time = Date.now() * 0.004;
                        this.epsteinModel.rotation.y = -Math.PI / 4 + Math.sin(time) * 0.2;
                        this.epsteinModel.position.y = 0 + Math.sin(time * 2) * 0.08;
                    }
                };
            }
        } else {
            console.error('❌ Модель flair.fbx не загружена! Проверьте путь assets/models/flair.fbx');
            // Создаём заглушку
            const geometry = new THREE.SphereGeometry(0.8, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0x442200 });
            const dummy = new THREE.Mesh(geometry, material);
            dummy.position.set(0, 0.8, 3.5);
            dummy.castShadow = true;
            this.scene.add(dummy);
            this.simpleDanceAnimation = () => {
                const time = Date.now() * 0.004;
                dummy.rotation.y = Math.sin(time) * 0.3;
                dummy.position.y = 0.8 + Math.sin(time * 2) * 0.08;
            };
        }
    }
    
    createStartButton() {
        this.startButton = document.createElement('button');
        this.startButton.textContent = '▶ НАЧАТЬ ИГРУ НА ОСТРОВЕ ЭПШТЕЙНА';
        this.startButton.style.position = 'absolute';
        this.startButton.style.bottom = '15%';
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
        this.startButton.style.boxShadow = '0 0 20px rgba(255,170,68,0.5)';
        this.startButton.onmouseenter = () => {
            this.startButton.style.transform = 'translateX(-50%) scale(1.05)';
            this.startButton.style.boxShadow = '0 0 30px rgba(255,170,68,0.8)';
        };
        this.startButton.onmouseleave = () => {
            this.startButton.style.transform = 'translateX(-50%) scale(1)';
            this.startButton.style.boxShadow = '0 0 20px rgba(255,170,68,0.5)';
        };
        this.startButton.onclick = () => {
            if (this.audio) this.audio.pause();
            this.dispose();
            if (this.onStart) this.onStart();
        };
        document.body.appendChild(this.startButton);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Обновление анимации Эпштейна
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        } else if (this.simpleDanceAnimation) {
            this.simpleDanceAnimation();
        }
        
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
        
        // Очищаем сцену
        while(this.scene && this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.scene = null;
        this.camera = null;
        this.controls = null;
        console.log('🎬 Меню уничтожено, Эпштейн из flair.fbx удалён');
    }
}
