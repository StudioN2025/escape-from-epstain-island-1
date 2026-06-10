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
        
        // Создаём простой остров для меню (без коллизий и интерактива)
        this.createMenuIsland();
        
        // Загружаем танцующего Эпштейна из AssetManager
        const danceModel = this.assetManager.getModel('dance');
        if (danceModel) {
            this.epsteinModel = danceModel;
            this.epsteinModel.scale.setScalar(0.045);
            this.epsteinModel.position.set(0, 0, 2);
            this.epsteinModel.rotation.y = -Math.PI / 4;
            this.epsteinModel.castShadow = true;
            this.scene.add(this.epsteinModel);
            if (this.epsteinModel.animations && this.epsteinModel.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.epsteinModel);
                const action = this.mixer.clipAction(this.epsteinModel.animations[0]);
                action.play();
                console.log('🎬 Эпштейн танцует!');
            } else {
                // Анимации нет, делаем простую покачку
                this.animateEpstein = () => {
                    if (this.epsteinModel) {
                        const time = Date.now() * 0.003;
                        this.epsteinModel.rotation.y = Math.sin(time) * 0.3;
                        this.epsteinModel.position.y = 0 + Math.sin(time * 2) * 0.05;
                    }
                };
            }
        } else {
            console.warn('⚠️ Модель dance.fbx не загружена, создаю заглушку');
            const geometry = new THREE.SphereGeometry(0.7, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: 0xffaa44 });
            const dummy = new THREE.Mesh(geometry, material);
            dummy.position.set(0, 0.7, 2);
            dummy.castShadow = true;
            this.scene.add(dummy);
            this.animateEpstein = () => {
                const time = Date.now() * 0.003;
                dummy.rotation.y = Math.sin(time) * 0.3;
                dummy.position.y = 0.7 + Math.sin(time * 2) * 0.05;
            };
        }
        
        if (!this.animateEpstein) {
            this.animateEpstein = () => {
                if (this.mixer) this.mixer.update(this.clock.getDelta());
            };
        }
        
        // Музыка из AssetManager
        const menuSound = this.assetManager.getSound('menu');
        if (menuSound) {
            this.audio = menuSound;
            this.audio.loop = true;
            this.audio.volume = 0.6;
            this.audio.currentTime = 0;
            this.audio.play().catch(e => console.log('Audio play error:', e));
        }
        
        this.createStartButton();
        this.animate();
    }
    
    createMenuIsland() {
        // Получаем текстуры из AssetManager
        const grassTex = this.assetManager.getTexture('grass');
        const sandTex = this.assetManager.getTexture('sand');
        
        // Земля
        const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Песок по краям
        const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(28, 32, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = true;
        this.scene.add(sandRing);
        
        // Простые деревья (несколько штук для красоты)
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a });
        const positions = [
            [-8, -0.5, -6], [6, -0.5, -7], [-7, -0.5, 5], [8, -0.5, 4],
            [-4, -0.5, -9], [5, -0.5, -8], [-6, -0.5, 8], [4, -0.5, 9]
        ];
        positions.forEach(pos => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.6, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.8, pos[2]);
            trunk.castShadow = true;
            const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 8), foliageMat);
            f1.position.set(pos[0], pos[1] + 1.7, pos[2]);
            const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 8), foliageMat);
            f2.position.set(pos[0], pos[1] + 2.5, pos[2]);
            this.scene.add(trunk, f1, f2);
        });
        
        // Вода
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 });
        const waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), waterMat);
        waterPlane.rotation.x = -Math.PI / 2;
        waterPlane.position.y = -0.6;
        this.scene.add(waterPlane);
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0x88aacc, 0.4);
        this.scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffdd99, 0.8);
        sunLight.position.set(20, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        this.scene.add(sunLight);
        
        console.log('🏝️ Остров в меню создан');
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
            if (this.audio) this.audio.pause();
            this.dispose();
            if (this.onStart) this.onStart();
        };
        document.body.appendChild(this.startButton);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        if (this.animateEpstein) this.animateEpstein();
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
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.scene = null;
        this.camera = null;
        this.controls = null;
        console.log('🎬 Меню уничтожено');
    }
}
