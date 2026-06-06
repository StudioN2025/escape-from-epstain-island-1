import * as THREE from 'three';

export class Monster {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.active = false;
        this.speed = 3.2;
        this.position = new THREE.Vector3(35, 0, 30);
        this.useFBX = false;
        this.mixer = null;
        // Сразу создаем стандартную модель
        this.createMesh();
    }
    
    createMesh() {
        console.log('🟢 Создание стандартной модели монстра');
        
        // Основное тело
        const geometry = new THREE.SphereGeometry(0.9, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x882222, 
            emissive: 0x331100,
            roughness: 0.3,
            metalness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        
        // Глаза
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa2222 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        leftEye.position.set(-0.3, 0.35, 0.8);
        rightEye.position.set(0.3, 0.35, 0.8);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
        
        // Зрачки (белые блики)
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), pupilMat);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), pupilMat);
        leftPupil.position.set(-0.35, 0.32, 1.0);
        rightPupil.position.set(0.25, 0.32, 1.0);
        this.mesh.add(leftPupil);
        this.mesh.add(rightPupil);
        
        // Рот
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x440000 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 16, 32), mouthMat);
        mouth.rotation.x = 0.2;
        mouth.position.set(0, 0.1, 0.85);
        this.mesh.add(mouth);
        
        // Рога
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xccccaa });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        leftHorn.position.set(-0.35, 0.7, 0.5);
        rightHorn.position.set(0.35, 0.7, 0.5);
        this.mesh.add(leftHorn);
        this.mesh.add(rightHorn);
        
        // Шипы на спине
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xaa6666 });
        for (let i = -0.5; i <= 0.5; i += 0.5) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), spikeMat);
            spike.position.set(i, -0.2, -0.7);
            this.mesh.add(spike);
        }
        
        this.scene.add(this.mesh);
        console.log('✅ Стандартная модель монстра создана и добавлена в сцену');
        console.log('📍 Позиция монстра:', this.position);
    }
    
    // Метод для замены стандартной модели на FBX
    replaceWithFBX(fbx) {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        this.mesh = fbx;
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.useFBX = true;
        this.scene.add(this.mesh);
        console.log('✅ Заменено на FBX модель монстра');
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            console.log('👾 Монстр активирован на позиции:', this.position);
        }
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        if (distance < 1.2) {
            console.log('💀 Монстр поймал игрока!');
            return true;
        }
        
        // Монстр всегда движется к игроку, если тот в радиусе 40 единиц
        if (distance < 40) {
            direction.normalize();
            // Скорость увеличивается при приближении
            const currentSpeed = this.speed + Math.max(0, (20 - distance) / 25);
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            // Границы острова
            this.position.x = Math.max(-47, Math.min(47, this.position.x));
            this.position.z = Math.max(-47, Math.min(47, this.position.z));
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                
                // Поворот к игроку
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
            }
            
            // Анимация для стандартной модели
            if (!this.useFBX && this.mesh) {
                const time = Date.now() * 0.008;
                this.mesh.position.y = Math.sin(time) * 0.1;
                this.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
            }
        } else if (!this.useFBX && this.mesh) {
            // Анимация ожидания для стандартной модели
            const time = Date.now() * 0.005;
            this.mesh.position.y = Math.sin(time) * 0.05;
        }
        
        return false;
    }
}
