import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.sprint = false;
        this.health = 100;
        this.isGrounded = true;
        this.gravity = -15;
        this.jumpPower = 7;
    }
    
    updatePhysics(deltaTime, worldBounds) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            
            // Ground check
            if (this.position.y <= 1.6) {
                this.position.y = 1.6;
                this.velocity.y = 0;
                this.isGrounded = true;
            }
        }
        
        // Simple collision with world bounds
        this.position.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, this.position.x));
        this.position.z = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, this.position.z));
    }
    
    jump() {
        if (this.isGrounded) {
            this.velocity.y = this.jumpPower;
            this.isGrounded = false;
            return true;
        }
        return false;
    }
    
    updatePosition(deltaTime, moveVector) {
        this.position.add(moveVector);
        this.camera.position.copy(this.position);
    }
}
