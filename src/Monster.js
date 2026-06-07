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
        
        const geometry = new THREE.SphereGeometry(0.9, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff6666,
            emissive: 0x442222,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.1
        });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        const eyeMat = new THREE.MeshStandardMaterial({ 
            color: 0xff3333, 
            emissive: 0xff2222,
            emissiveIntensity: 0.8
        });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), eyeMat);
        leftEye.position.set(-0.35, 0.35, 0.85);
        rightEye.position.set(0.35, 0.35, 0.85);
        group.add(leftEye);
        group.add(rightEye);
        
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pupilMat);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pupilMat);
        leftPupil.position.set(-0.35, 0.33, 1.05);
        rightPupil.position.set(0.35, 0.33, 1.05);
        group.add(leftPupil);
        group.add(rightPupil);
        
        const highlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const leftHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), highlightMat);
        const rightHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), highlightMat);
        leftHighlight.position.set(-0.4, 0.42, 1.1);
        rightHighlight.position.set(0.3, 0.42, 1.1);
        group.add(leftHighlight);
        group.add(rightHighlight);
        
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x883333 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 16, 32), mouthMat);
        mouth.rotation.x = 0.2;
        mouth.position.set(0, 0.05, 0.9);
        group.add(mouth);
        
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffee });
        const teethPositions = [[-0.12, 0.0, 1.05], [0, 0.0, 1.07], [0.12, 0.0, 1.05]];
        teethPositions.forEach(pos => {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), toothMat);
            tooth.position.set(pos[0], pos[1], pos[2]);
            group.add(tooth);
        });
        
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xddaa77 });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), hornMat);
        leftHorn.position.set(-0.4, 0.68, 0.5);
        rightHorn.position.set(0.4, 0.68, 0.5);
        group.add(leftHorn);
        group.add(rightHorn);
        
        const legMat = new THREE.MeshStandardMaterial({ color: 0xcc5555 });
        const legPositions = [[-0.45, -0.75, 0.55], [0.45, -0.75, 0.55], [-0.45, -0.75, -0.35], [0.45, -0.75, -0.35]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.65, 6), legMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        const clawMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const clawPositions = [[-0.5, -0.45, 0.9], [0.5, -0.45, 0.9], [-0.5, -0.45, -0.65], [0.5, -0.45, -0.65]];
        clawPositions.forEach(pos => {
            const claw = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 4), clawMat);
            claw.position.set(pos[0], pos[1], pos[2]);
            group.add(claw);
        });
        
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xdd6666 });
        const spikePositions = [[0, 0.25, -0.85], [0.3, 0.15, -0.9], [-0.3, 0.15, -0.9], [0.15, -0.05, -0.95], [-0.15, -0.05, -0.95]];
        spikePositions.forEach(pos => {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), spikeMat);
            spike.position.set(pos[0], pos[1], pos[2]);
            group.add(spike);
        });
        
        const monsterLight = new THREE.PointLight(0xff6633, 0.8, 15);
        monsterLight.position.set(0, 0.5, 0);
        group.add(monsterLight);
        
        this.mesh = group;
        this.mesh.position.set(this.position.x, 0, this.position.z);
        this.scene.add(this.mesh);
        
        console.log('✅ Монстр создан на позиции:', this.mesh.position);
        
        const debugBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.3, 1.3, 1.3),
            new THREE.MeshBasicMaterial({ color: 0xffaa44, wireframe: true, transparent: true, opacity: 0.3 })
        );
        debugBox.position.set(0, 0, 0);
        this.mesh.add(debugBox);
        
        const animateLights = () => {
            requestAnimationFrame(animateLights);
            if (this.mesh && this.mesh.parent) {
                const intensity = 0.6 + Math.sin(Date.now() * 0.008) * 0.3;
                monsterLight.intensity = intensity;
            }
        };
        animateLights();
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
        
        const fbxLight = new THREE.PointLight(0xff6633, 0.8, 15);
        fbxLight.position.set(0, 0.5, 0);
        this.mesh.add(fbxLight);
        
        this.scene.add(this.mesh);
        console.log('✅ Заменено на FBX модель монстра с подсветкой');
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            console.log('👾 Монстр АКТИВИРОВАН на позиции:', this.position);
            console.log('👾 Монстр начинает охоту за игроком!');
        }
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) {
            return false;
        }
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        // Отладочный вывод каждые 60 кадров
        if (Math.random() < 0.02) {
            console.log(`📏 Расстояние до монстра: ${distance.toFixed(2)}м | Позиция монстра: (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) | Позиция игрока: (${playerPos.x.toFixed(1)}, ${playerPos.z.toFixed(1)})`);
        }
        
        // ПРОВЕРКА СТОЛКНОВЕНИЯ - увеличен радиус захвата
        if (distance < 1.5) {
            console.log('💀💀💀 МОНСТР СХВАТИЛ ИГРОКА! 💀💀💀');
            console.log(`💀 Расстояние: ${distance.toFixed(2)}м`);
            return true; // Игрок пойман
        }
        
        // Преследование
        if (distance < 50) {
            direction.normalize();
            // Скорость увеличивается при приближении
            let currentSpeed = this.speed;
            if (distance < 10) {
                currentSpeed = this.speed * 1.8; // Ускорение когда близко
                console.log(`🏃‍♂️ Монстр ускоряется! Скорость: ${currentSpeed.toFixed(1)}`);
            } else if (distance < 20) {
                currentSpeed = this.speed * 1.4;
            }
            
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            // Границы острова
            this.position.x = Math.max(-47, Math.min(47, this.position.x));
            this.position.z = Math.max(-47, Math.min(47, this.position.z));
            this.position.y = 0;
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
                
                // Анимация при движении
                const time = Date.now() * 0.012;
                const scale = 1 + Math.sin(time) * 0.05;
                this.mesh.scale.set(scale, scale, scale);
            }
        }
        
        return false;
    }
}
