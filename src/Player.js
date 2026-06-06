import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(0, 1.6, 0);
        this.sprint = false;
        this.health = 100;
    }
    
    updatePosition(deltaTime, moveVector) {
        this.position.add(moveVector);
        this.camera.position.copy(this.position);
    }
}
