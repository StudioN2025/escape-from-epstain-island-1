import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class Monster {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.active = false;
        this.speed = 3.2;
        this.position = new THREE.Vector3(35, 0, 30);
        this.useFBX = false; // Флаг использования FBX модели
        this.mixer = null; // Анимационный микшер
        this.animations = {};
        this.currentAction = null;
        this.loader = new FBXLoader();
    }
    
    async loadFBXModel(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (fbx) => {
                // Удаляем старую модель (сферу)
                if (this.mesh && !this.useFBX) {
                    this.scene.remove(this.mesh);
                }
                
                this.mesh = fbx;
                this.mesh.position.copy(this.position);
                this.mesh.scale.setScalar(0.02); // Масштабируем FBX модель
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                
                // Настройка анимаций
                this.mixer = new THREE.AnimationMixer(this.mesh);
                
                if (fbx.animations && fbx.animations.length > 0) {
                    console.log(`Загружено ${fbx.animations.length} анимаций`);
                    fbx.animations.forEach((clip, index) => {
                        const action = this.mixer.clipAction(clip);
                        this.animations[`anim_${index}`] = action;
                    });
                    
                    // Воспроизводим первую анимацию (обычно idle или run)
                    if (this.animations.anim_0) {
                        this.currentAction = this.animations.anim_0;
                        this.currentAction.play();
                    }
                }
                
                this.scene.add(this.mesh);
                this.useFBX = true;
                resolve();
            }, undefined, (error) => {
                console.error('Ошибка загрузки FBX модели:', error);
                reject(error);
            });
        });
    }
    
    createMesh() {
        // Создаем стандартную сферу, если FBX не загружен
        const geometry = new THREE.SphereGeometry(0.9, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x882222, 
            emissive: 0x331100,
            roughness: 0.3,
            metalness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        
        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa2222 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        leftEye.position.set(-0.3, 0.35, 0.8);
        rightEye.position.set(0.3, 0.35, 0.8);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
        
        // Mouth
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x440000 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 16, 32), mouthMat);
        mouth.rotation.x = 0.2;
        mouth.position.set(0, 0.1, 0.85);
        this.mesh.add(mouth);
        
        // Horns
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xccccaa });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        leftHorn.position.set(-0.35, 0.7, 0.5);
        rightHorn.position.set(0.35, 0.7, 0.5);
        this.mesh.add(leftHorn);
        this.mesh.add(rightHorn);
        
        this.scene.add(this.mesh);
        this.useFBX = false;
    }
    
    // Метод для загрузки кастомной FBX модели
    async loadCustomModel(modelUrl, animationUrl = null) {
        try {
            await this.loadFBXModel(modelUrl);
            console.log('FBX модель монстра успешно загружена');
            return true;
        } catch (error) {
            console.warn('Не удалось загрузить FBX модель, использую стандартную:', error);
            this.createMesh();
            return false;
        }
    }
    
    // Смена анимации
    playAnimation(animationName, loop = true) {
        if (!this.mixer || !this.animations[animationName]) return;
        
        if (this.currentAction) {
            this.currentAction.fadeOut(0.3);
        }
        
        this.currentAction = this.animations[animationName];
        this.currentAction.reset();
        this.currentAction.fadeIn(0.3);
        this.currentAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        this.currentAction.clampWhenFinished = !loop;
        this.currentAction.play();
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        // Воспроизводим анимацию бега при активации
        if (this.useFBX && this.animations.anim_1) {
            this.playAnimation('anim_1');
        }
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        if (distance < 1.2) {
            return true; // Player caught
        }
        
        // Обновляем анимационный микшер
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Only chase if player is within 25 units
        if (distance < 25) {
            direction.normalize();
            const currentSpeed = this.speed + Math.max(0, (15 - distance) / 20);
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            // Island boundaries
            this.position.x = Math.max(-50, Math.min(50, this.position.x));
            this.position.z = Math.max(-50, Math.min(50, this.position.z));
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                
                // Rotate to face player
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
            }
            
            // Меняем анимацию в зависимости от скорости
            if (this.useFBX) {
                if (currentSpeed > 3.5 && this.animations.anim_1) {
                    if (this.currentAction !== this.animations.anim_1) {
                        this.playAnimation('anim_1');
                    }
                } else if (this.animations.anim_0 && this.currentAction !== this.animations.anim_0) {
                    this.playAnimation('anim_0');
                }
            } else {
                // Анимация для стандартной модели
                const time = Date.now() * 0.008;
                if (this.mesh) {
                    this.mesh.position.y = Math.sin(time) * 0.1;
                    this.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
                    
                    if (distance < 8 && Math.floor(Date.now() / 500) % 2 === 0) {
                        this.mesh.position.y = Math.sin(time * 4) * 0.15;
                    }
                }
            }
        } else if (this.useFBX && this.animations.anim_0 && this.currentAction !== this.animations.anim_0) {
            // Воспроизводим idle анимацию когда далеко
            this.playAnimation('anim_0');
        }
        
        return false;
    }
}
