import * as THREE from 'three';

export class Monster {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.active = false;
        this.speed = 4.5;
        this.position = new THREE.Vector3(15, 0, 15);
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.8, 32, 32);
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
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), eyeMat);
        leftEye.position.set(-0.25, 0.3, 0.7);
        rightEye.position.set(0.25, 0.3, 0.7);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
        
        // Add horns
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xccccaa });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), hornMat);
        leftHorn.position.set(-0.3, 0.65, 0.4);
        rightHorn.position.set(0.3, 0.65, 0.4);
        this.mesh.add(leftHorn);
        this.mesh.add(rightHorn);
        
        this.scene.add(this.mesh);
    }
    
    activate() {
        this.active = true;
        this.position.set(12, 0, 10);
        this.mesh.position.copy(this.position);
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        if (distance < 1.2) {
            return true; // Player caught
        }
        
        if (distance < 15) {
            direction.normalize();
            const move = direction.multiplyScalar(this.speed * deltaTime);
            this.position.add(move);
            
            // Island boundaries
            this.position.x = Math.max(-22, Math.min(22, this.position.x));
            this.position.z = Math.max(-22, Math.min(22, this.position.z));
            
            this.mesh.position.copy(this.position);
            
            // Animation - bobbing
            const time = Date.now() * 0.008;
            this.mesh.position.y = Math.sin(time) * 0.1;
            this.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
            
            // Rotate to face player
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = angle;
        }
        
        return false;
    }
}
