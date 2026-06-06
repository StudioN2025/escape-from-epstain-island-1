import * as THREE from 'three';

export class Monster {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.active = false;
        this.speed = 3.2; // Slower speed
        this.position = new THREE.Vector3(30, 0, 25); // Far away spawn
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
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30); // Start far away
        this.mesh.position.copy(this.position);
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        if (distance < 1.2) {
            return true; // Player caught
        }
        
        // Only chase if player is within 25 units
        if (distance < 25) {
            direction.normalize();
            // Speed increases as monster gets closer
            const currentSpeed = this.speed + Math.max(0, (15 - distance) / 20);
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            // Island boundaries (much larger)
            this.position.x = Math.max(-50, Math.min(50, this.position.x));
            this.position.z = Math.max(-50, Math.min(50, this.position.z));
            
            this.mesh.position.copy(this.position);
            
            // Animation - bobbing and scaling
            const time = Date.now() * 0.008;
            this.mesh.position.y = Math.sin(time) * 0.1;
            this.mesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
            
            // Rotate to face player
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = angle;
            
            // Footstep sounds effect (visual only)
            if (distance < 8 && Math.floor(Date.now() / 500) % 2 === 0) {
                this.mesh.position.y = Math.sin(time * 4) * 0.15;
            }
        }
        
        return false;
    }
}
