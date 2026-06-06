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
        this.createMesh();
    }
    
    createMesh() {
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
        
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa2222 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        leftEye.position.set(-0.3, 0.35, 0.8);
        rightEye.position.set(0.3, 0.35, 0.8);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
        
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x440000 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 16, 32), mouthMat);
        mouth.rotation.x = 0.2;
        mouth.position.set(0, 0.1, 0.85);
        this.mesh.add(mouth);
        
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xccccaa });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), hornMat);
        leftHorn.position.set(-0.35, 0.7, 0.5);
        rightHorn.position.set(0.35, 0.7, 0.5);
        this.mesh.add(leftHorn);
        this.mesh.add(rightHorn);
        
        this.scene.add(this.mesh);
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        if (distance < 1.2) {
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
            if (!this.useFBX) {
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
