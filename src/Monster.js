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
        console.log('🟢 Создание стандартной модели монстра');
        
        const group = new THREE.Group();
        
        // Основное тело
        const geometry = new THREE.SphereGeometry(0.9, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xcc3333, 
            emissive: 0x331100,
            roughness: 0.3,
            metalness: 0.1
        });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Глаза
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff4422 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), eyeMat);
        leftEye.position.set(-0.35, 0.35, 0.85);
        rightEye.position.set(0.35, 0.35, 0.85);
        group.add(leftEye);
        group.add(rightEye);
        
        // Зрачки
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pupilMat);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pupilMat);
        leftPupil.position.set(-0.35, 0.33, 1.05);
        rightPupil.position.set(0.35, 0.33, 1.05);
        group.add(leftPupil);
        group.add(rightPupil);
        
        // Рот
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x440000 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 16, 32), mouthMat);
        mouth.rotation.x = 0.2;
        mouth.position.set(0, 0.05, 0.9);
        group.add(mouth);
        
        // Рога
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), hornMat);
        leftHorn.position.set(-0.4, 0.65, 0.5);
        rightHorn.position.set(0.4, 0.65, 0.5);
        group.add(leftHorn);
        group.add(rightHorn);
        
        // Ноги (чтобы не летал)
        const legMat = new THREE.MeshStandardMaterial({ color: 0xaa3333 });
        const legPositions = [[-0.4, -0.7, 0.5], [0.4, -0.7, 0.5], [-0.4, -0.7, -0.3], [0.4, -0.7, -0.3]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 6), legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        // Добавляем собственный свет к монстру
        const monsterLight = new THREE.PointLight(0xff4422, 0.8, 15);
        monsterLight.position.set(0, 0.5, 0);
        group.add(monsterLight);
        
        this.mesh = group;
        // Правильная позиция по Y - ставим на землю
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.scene.add(this.mesh);
        
        console.log('✅ Монстр создан на позиции:', this.mesh.position);
        
        // Добавляем вспомогательный куб для отладки
        const debugBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.2, 1.2),
            new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.6 })
        );
        debugBox.position.set(0, 0, 0);
        this.mesh.add(debugBox);
    }
    
    replaceWithFBX(fbx) {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        this.mesh = fbx;
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.useFBX = true;
        this.scene.add(this.mesh);
        console.log('✅ Заменено на FBX модель монстра');
    }
    
    activate() {
        this.active = true;
        // Убеждаемся что Y позиция = 0 (на земле)
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
            console.log('💀 МОНСТР СХВАТИЛ ИГРОКА!');
            return true;
        }
        
        if (distance < 40) {
            direction.normalize();
            const currentSpeed = this.speed + Math.max(0, (20 - distance) / 25);
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            // Границы и Y позиция = 0 (земля)
            this.position.x = Math.max(-47, Math.min(47, this.position.x));
            this.position.z = Math.max(-47, Math.min(47, this.position.z));
            this.position.y = 0;
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
                
                // Анимация пульсации
                const time = Date.now() * 0.01;
                const scale = 1 + Math.sin(time) * 0.03;
                this.mesh.scale.set(scale, scale, scale);
            }
        }
        
        return false;
    }
}
