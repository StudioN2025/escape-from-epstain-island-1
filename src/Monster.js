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
        
        // Создаем группу для монстра
        const group = new THREE.Group();
        
        // Основное тело - яркий красный цвет
        const geometry = new THREE.SphereGeometry(1.0, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff3333, 
            emissive: 0x441111,
            roughness: 0.2,
            metalness: 0.1
        });
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Глаза - ярко-красные светящиеся
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff2222 });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), eyeMat);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), eyeMat);
        leftEye.position.set(-0.4, 0.4, 1.0);
        rightEye.position.set(0.4, 0.4, 1.0);
        group.add(leftEye);
        group.add(rightEye);
        
        // Зрачки
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pupilMat);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pupilMat);
        leftPupil.position.set(-0.4, 0.38, 1.15);
        rightPupil.position.set(0.4, 0.38, 1.15);
        group.add(leftPupil);
        group.add(rightPupil);
        
        // Рот с зубами
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x660000 });
        const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 16, 32), mouthMat);
        mouth.rotation.x = 0.3;
        mouth.position.set(0, 0.05, 1.05);
        group.add(mouth);
        
        // Зубы
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffcc });
        for (let i = -0.25; i <= 0.25; i += 0.25) {
            const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 4), toothMat);
            tooth.position.set(i, -0.1, 1.15);
            group.add(tooth);
        }
        
        // Рога
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
        const leftHorn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), hornMat);
        const rightHorn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), hornMat);
        leftHorn.position.set(-0.45, 0.8, 0.6);
        rightHorn.position.set(0.45, 0.8, 0.6);
        group.add(leftHorn);
        group.add(rightHorn);
        
        // Шипы на спине
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xcc6666 });
        const spikePositions = [[0, 0.2, -0.8], [0.3, 0.1, -0.85], [-0.3, 0.1, -0.85], [0.15, -0.1, -0.9], [-0.15, -0.1, -0.9]];
        spikePositions.forEach(pos => {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), spikeMat);
            spike.position.set(pos[0], pos[1], pos[2]);
            group.add(spike);
        });
        
        // Добавляем свечение вокруг монстра
        const glowLight = new THREE.PointLight(0xff3300, 0.8, 12);
        glowLight.position.set(0, 0.5, 0);
        group.add(glowLight);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        console.log('✅ Стандартная модель монстра создана и добавлена в сцену');
        console.log('📍 Позиция монстра:', this.position);
        console.log('📐 Масштаб монстра:', this.mesh.scale);
        
        // Добавляем вспомогательный куб для отладки (будет виден всегда)
        const debugBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.5, 1.5),
            new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.5 })
        );
        debugBox.position.set(0, 0, 0);
        this.mesh.add(debugBox);
        console.log('🔍 Добавлен отладочный куб для визуализации позиции монстра');
    }
    
    activate() {
        this.active = true;
        this.position.set(35, 0, 30);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            console.log('👾 Монстр активирован на позиции:', this.position);
            
            // Добавляем дополнительный свет при активации
            const activationLight = new THREE.PointLight(0xff0000, 2, 20);
            activationLight.position.copy(this.position);
            this.scene.add(activationLight);
            setTimeout(() => this.scene.remove(activationLight), 500);
        }
    }
    
    update(playerPos, deltaTime) {
        if (!this.active) return false;
        
        const direction = new THREE.Vector3().subVectors(playerPos, this.position);
        const distance = direction.length();
        
        // Отладочный вывод расстояния каждые 60 кадров
        if (Math.random() < 0.02) {
            console.log(`📏 Расстояние до монстра: ${distance.toFixed(1)}м`);
        }
        
        if (distance < 1.5) {
            console.log('💀 МОНСТР СХВАТИЛ ИГРОКА!');
            return true;
        }
        
        if (distance < 50) {
            direction.normalize();
            const currentSpeed = this.speed + Math.max(0, (20 - distance) / 25);
            const move = direction.multiplyScalar(currentSpeed * deltaTime);
            this.position.add(move);
            
            this.position.x = Math.max(-47, Math.min(47, this.position.x));
            this.position.z = Math.max(-47, Math.min(47, this.position.z));
            
            if (this.mesh) {
                this.mesh.position.copy(this.position);
                const angle = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = angle;
                
                // Анимация пульсации при движении
                const time = Date.now() * 0.01;
                const scale = 1 + Math.sin(time) * 0.05;
                this.mesh.scale.set(scale, scale, scale);
                
                // Меняем цвет глаз при приближении
                if (distance < 10) {
                    const intensity = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
                    const eyeLight = this.mesh.children.find(c => c instanceof THREE.PointLight);
                    if (eyeLight) eyeLight.intensity = intensity;
                }
            }
        }
        
        return false;
    }
}
