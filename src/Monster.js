import * as THREE from 'three';

export class Monster {
    constructor(scene) {
        if (!scene) {
            console.error('Ошибка: scene не передан в Monster');
            return;
        }
        this.scene = scene;
        this.mesh = null;
        this.active = false;
        this.speed = 4.0;
        this.position = new THREE.Vector3(35, 0, 30);
        this.useFBX = false;
        this.mixer = null;
        this.createMesh();
    }
    
    createMesh() {
        if (!this.scene) return;
        const group = new THREE.Group();
        const geometry = new THREE.SphereGeometry(0.9, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xcc4444, emissive: 0x331111, roughness: 0.3 });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        group.add(body);
        
        const jacketMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const jacket = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.8), jacketMat);
        jacket.position.set(0, -0.2, 0.4);
        jacket.castShadow = true;
        group.add(jacket);
        
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), eyeMat);
        leftEye.position.set(-0.3, 0.35, 0.85);
        rightEye.position.set(0.3, 0.35, 0.85);
        group.add(leftEye);
        group.add(rightEye);
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), pupilMat);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), pupilMat);
        leftPupil.position.set(-0.3, 0.33, 1.05);
        rightPupil.position.set(0.3, 0.33, 1.05);
        group.add(leftPupil);
        group.add(rightPupil);
        
        this.mesh = group;
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.scene.add(this.mesh);
        console.log('👔 Эпштейн создан (стандартная модель)');
    }
    
    replaceWithFBX(fbx) {
        if (this.mesh && this.scene) this.scene.remove(this.mesh);
        this.mesh = fbx;
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.mesh.castShadow = true;
        this.useFBX = true;
        if (this.scene) this.scene.add(this.mesh);
        console.log('👔 Модель Эпштейна загружена');
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) this.mesh.position.copy(this.position);
        console.log('👔 Эпштейн активирован, скорость 4.0');
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 1.4) {
            console.log('💀 ЭПШТЕЙН СХВАТИЛ ВАС!');
            return true;
        }
        if (distance < 50) {
            const dirX = dx / distance;
            const dirZ = dz / distance;
            const angle = Math.atan2(dirX, dirZ);
            if (this.mesh) this.mesh.rotation.y = angle;
            this.position.x += dirX * this.speed * deltaTime;
            this.position.z += dirZ * this.speed * deltaTime;
            this.position.x = Math.max(-47, Math.min(47, this.position.x));
            this.position.z = Math.max(-47, Math.min(47, this.position.z));
            this.position.y = 0;
            if (this.mesh) this.mesh.position.copy(this.position);
            const time = Date.now() * 0.012;
            const scale = 1 + Math.sin(time) * 0.05;
            if (this.mesh) this.mesh.scale.set(scale, scale, scale);
        }
        return false;
    }
}
