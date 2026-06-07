import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.interactiveObjects = [];
        this.objects = [];
        this.exitDoor = null;
        this.waterPlane = null;
        this.boundaryWalls = [];
        this.basementObjects = [];
        this.gltfLoader = new GLTFLoader();
        this.treeModel = null;
        this.treesLoaded = false;
        this.treeInstances = [];
        this.loadDistance = 40;
        this.unloadDistance = 50;
        this.playerPosition = new THREE.Vector3(0, 0, 0);
        this.lastUpdateTime = 0;
        this.sunLight = null;
        this.ambientLight = null;
    }
    
    updatePlayerPosition(position) {
        this.playerPosition.copy(position);
        
        const now = Date.now();
        if (now - this.lastUpdateTime > 100) {
            this.lastUpdateTime = now;
            this.updateVisibility();
        }
    }
    
    updateVisibility() {
        this.treeInstances.forEach(tree => {
            const distance = this.playerPosition.distanceTo(tree.position);
            if (distance < this.loadDistance) {
                tree.visible = true;
            } else if (distance > this.unloadDistance) {
                tree.visible = false;
            }
        });
        
        this.objects.forEach(obj => {
            if (obj.userData && obj.userData.isBoat) {
                const distance = this.playerPosition.distanceTo(obj.position);
                obj.visible = distance < this.loadDistance + 10;
            }
        });
    }
    
    async createBasement() {
        this.clearBasement();
        
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.basementObjects.push(floor);
        
        const gridHelper = new THREE.GridHelper(20, 20, 0x886644, 0x664422);
        gridHelper.position.y = -0.4;
        this.scene.add(gridHelper);
        this.basementObjects.push(gridHelper);
        
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.6 });
        const walls = [
            { pos: [0, 1.5, -9.5], scale: [20, 3, 0.5] },
            { pos: [0, 1.5, 9.5], scale: [20, 3, 0.5] },
            { pos: [-9.5, 1.5, 0], scale: [0.5, 3, 20] },
            { pos: [9.5, 1.5, 0], scale: [0.5, 3, 20] }
        ];
        
        walls.forEach(wall => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wall.scale), wallMat);
            mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.basementObjects.push(mesh);
        });
        
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        this.basementObjects.push(ceiling);
        
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        for (let x = -7; x <= 7; x += 3.5) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 18), beamMat);
            beam.position.set(x, 2.7, 0);
            this.scene.add(beam);
            this.basementObjects.push(beam);
        }
        
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
        for (let x = -6; x <= 6; x += 6) {
            for (let z = -6; z <= 6; z += 6) {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), pillarMat);
                pillar.position.set(x, 0, z);
                pillar.castShadow = true;
                this.scene.add(pillar);
                this.basementObjects.push(pillar);
            }
        }
        
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        this.exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), doorMat);
        this.exitDoor.position.set(8, 0, -9.4);
        this.exitDoor.castShadow = true;
        this.scene.add(this.exitDoor);
        this.basementObjects.push(this.exitDoor);
        
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a });
        const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.3), frameMat);
        frameLeft.position.set(7.4, 1.1, -9.4);
        const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.3), frameMat);
        frameRight.position.set(8.6, 1.1, -9.4);
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.3), frameMat);
        frameTop.position.set(8, 2.3, -9.4);
        this.scene.add(frameLeft);
        this.scene.add(frameRight);
        this.scene.add(frameTop);
        this.basementObjects.push(frameLeft, frameRight, frameTop);
        
        this.addBarrels();
        this.loadTorchesGLB();
    }
    
    addBarrels() {
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a });
        const positions = [[-4, -0.5, 3], [3, -0.5, -3], [5, -0.5, 2], [-5, -0.5, -2], [0, -0.5, 5]];
        positions.forEach(pos => {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8), barrelMat);
            barrel.position.set(pos[0], pos[1], pos[2]);
            barrel.castShadow = true;
            this.scene.add(barrel);
            this.basementObjects.push(barrel);
        });
    }
    
    loadTorchesGLB() {
        const torchPath = 'assets/models/old_torch_with_wall_mounting.glb';
        const torchPositions = [[-7, 1, -6], [7, 1, -6], [-7, 1, 6], [7, 1, 6]];
        
        this.gltfLoader.load(torchPath, (gltf) => {
            console.log('✅ GLB модель факела загружена!');
            
            torchPositions.forEach(pos => {
                const torch = gltf.scene.clone();
                
                const box = new THREE.Box3().setFromObject(torch);
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                const scale = 0.8 / maxSize;
                
                torch.scale.setScalar(scale);
                torch.position.set(pos[0], pos[1], pos[2]);
                torch.castShadow = true;
                
                this.scene.add(torch);
                this.basementObjects.push(torch);
                
                const light = new THREE.PointLight(0xff6633, 0.6, 8);
                light.position.set(pos[0], pos[1] + 0.3, pos[2]);
                this.scene.add(light);
                this.basementObjects.push(light);
                
                const animateLight = () => {
                    requestAnimationFrame(animateLight);
                    if (light.parent) {
                        light.intensity = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
                    }
                };
                animateLight();
            });
            
        }, (xhr) => {
            if (xhr.total) {
                console.log(`Загрузка факела: ${Math.floor(xhr.loaded / xhr.total * 100)}%`);
            }
        }, (error) => {
            console.warn('⚠️ Не удалось загрузить GLB модель факела, создаю стандартные');
            this.addTorchesStandard();
        });
    }
    
    addTorchesStandard() {
        const torchMat = new THREE.MeshStandardMaterial({ color: 0xaa6633 });
        const lightColor = 0xff6633;
        
        const torchPositions = [[-7, 1, -6], [7, 1, -6], [-7, 1, 6], [7, 1, 6]];
        torchPositions.forEach(pos => {
            const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), torchMat);
            torch.position.set(pos[0], pos[1], pos[2]);
            torch.castShadow = true;
            this.scene.add(torch);
            this.basementObjects.push(torch);
            
            const flameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 6), flameMat);
            flame.position.set(pos[0], pos[1] + 0.7, pos[2]);
            this.scene.add(flame);
            this.basementObjects.push(flame);
            
            const light = new THREE.PointLight(lightColor, 0.5, 8);
            light.position.set(pos[0], pos[1] + 0.5, pos[2]);
            this.scene.add(light);
            this.basementObjects.push(light);
        });
    }
    
    createInteractiveObjects(interactCallback) {
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4 });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8), pedestalMat);
        pedestal.position.set(-3, -0.3, 4);
        pedestal.castShadow = true;
        this.scene.add(pedestal);
        this.basementObjects.push(pedestal);
        
        const keyPath = 'assets/models/key.glb';
        
        this.gltfLoader.load(keyPath, (gltf) => {
            console.log('✅ GLB модель ключа загружена!');
            const keyModel = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(keyModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const desiredSize = 0.2;
            const scale = desiredSize / maxSize;
            
            keyModel.scale.setScalar(scale);
            keyModel.position.set(-3, 0.15, 4);
            keyModel.castShadow = true;
            keyModel.receiveShadow = true;
            
            const newBox = new THREE.Box3().setFromObject(keyModel);
            const minY = newBox.min.y;
            keyModel.position.y += -minY + 0.1;
            
            keyModel.userData = {
                onInteract: () => interactCallback('key')
            };
            
            this.scene.add(keyModel);
            this.basementObjects.push(keyModel);
            this.interactiveObjects.push(keyModel);
            
            const startY = keyModel.position.y;
            const animateKey = () => {
                requestAnimationFrame(animateKey);
                if (keyModel.parent) {
                    const time = Date.now() * 0.003;
                    keyModel.position.y = startY + Math.sin(time) * 0.08;
                    keyModel.rotation.y += 0.02;
                    keyModel.rotation.x = Math.sin(time * 0.5) * 0.1;
                    keyModel.rotation.z = Math.cos(time * 0.7) * 0.1;
                }
            };
            animateKey();
            
            const glowLight = new THREE.PointLight(0xffaa44, 0.5, 3);
            glowLight.position.set(-3, 0.3, 4);
            this.scene.add(glowLight);
            this.basementObjects.push(glowLight);
            
            const animateLight = () => {
                requestAnimationFrame(animateLight);
                if (glowLight.parent) {
                    glowLight.intensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
                }
            };
            animateLight();
            
        }, (xhr) => {
            if (xhr.total) {
                console.log(`Загрузка ключа: ${Math.floor(xhr.loaded / xhr.total * 100)}%`);
            }
        }, (error) => {
            console.warn('⚠️ Не удалось загрузить GLB модель ключа, создаю стандартную');
            this.createDefaultKey(interactCallback);
        });
    }
    
    createDefaultKey(interactCallback) {
        const keyGroup = new THREE.Group();
        
        const ringGeo = new THREE.TorusGeometry(0.18, 0.05, 16, 32);
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.9, roughness: 0.2, emissive: 0x442200 });
        const ring = new THREE.Mesh(ringGeo, keyMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = Math.PI / 4;
        keyGroup.add(ring);
        
        const shaftGeo = new THREE.BoxGeometry(0.08, 0.08, 0.35);
        const shaft = new THREE.Mesh(shaftGeo, keyMat);
        shaft.position.set(0.25, 0, 0);
        keyGroup.add(shaft);
        
        const toothGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
        const tooth1 = new THREE.Mesh(toothGeo, keyMat);
        tooth1.position.set(0.45, -0.05, 0);
        const tooth2 = new THREE.Mesh(toothGeo, keyMat);
        tooth2.position.set(0.45, 0.05, 0);
        keyGroup.add(tooth1);
        keyGroup.add(tooth2);
        
        keyGroup.position.set(-3, 0, 4);
        keyGroup.castShadow = true;
        this.scene.add(keyGroup);
        this.basementObjects.push(keyGroup);
        
        keyGroup.userData = {
            onInteract: () => interactCallback('key')
        };
        this.interactiveObjects.push(keyGroup);
        
        const glowLight = new THREE.PointLight(0xffaa44, 0.5, 3);
        glowLight.position.set(-3, 0.2, 4);
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        const animateKey = () => {
            requestAnimationFrame(animateKey);
            if (keyGroup.parent) {
                keyGroup.position.y = 0 + Math.sin(Date.now() * 0.003) * 0.1;
                keyGroup.rotation.y += 0.02;
                keyGroup.rotation.z = Math.sin(Date.now() * 0.002) * 0.1;
                glowLight.intensity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
            }
        };
        animateKey();
    }
    
    showExitDoor() {
        this.exitDoor.userData = {
            onInteract: () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('door');
                }
            }
        };
        this.interactiveObjects.push(this.exitDoor);
        
        const glowLight = new THREE.PointLight(0xffaa44, 0.8, 5);
        glowLight.position.copy(this.exitDoor.position);
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        const animateGlow = () => {
            requestAnimationFrame(animateGlow);
            if (glowLight.parent) {
                glowLight.intensity = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
            }
        };
        animateGlow();
    }
    
    clearBasement() {
        this.basementObjects.forEach(obj => {
            if (obj && obj.parent) {
                this.scene.remove(obj);
            }
        });
        this.basementObjects = [];
        this.interactiveObjects = [];
        this.exitDoor = null;
    }
    
    createIsland() {
        this.clearBasement();
        
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.003);
        
        // НАСТРАИВАЕМ СОЛНЦЕ КАК ИСТОЧНИК СВЕТА
        this.setupSunLighting();
        
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
        
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xddbb77, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(45, 50, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = true;
        this.scene.add(sandRing);
        this.objects.push(sandRing);
        
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2a });
        for (let i = 0; i < 40; i++) {
            const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.4, 8), hillMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 35;
            hill.position.x = Math.cos(angle) * radius;
            hill.position.z = Math.sin(angle) * radius;
            hill.position.y = -0.35;
            hill.castShadow = true;
            this.scene.add(hill);
            this.objects.push(hill);
        }
        
        this.loadTreesWithVisibility();
        this.loadCampfireGLB();
        this.loadBoatGLB();
        
        const waterMat = new THREE.MeshStandardMaterial({ 
            color: 0x3366aa, 
            metalness: 0.9, 
            roughness: 0.2, 
            transparent: true, 
            opacity: 0.85 
        });
        this.waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), waterMat);
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.y = -0.6;
        this.waterPlane.receiveShadow = true;
        this.scene.add(this.waterPlane);
        this.objects.push(this.waterPlane);
        
        const boundarySize = 48;
        const boundaryHeight = 5;
        const boundaryMat = new THREE.MeshBasicMaterial({ visible: false });
        
        const northBoundary = new THREE.Mesh(new THREE.BoxGeometry(boundarySize * 2, boundaryHeight, 1), boundaryMat);
        northBoundary.position.set(0, 2, boundarySize);
        this.scene.add(northBoundary);
        this.boundaryWalls.push(northBoundary);
        this.objects.push(northBoundary);
        
        const southBoundary = new THREE.Mesh(new THREE.BoxGeometry(boundarySize * 2, boundaryHeight, 1), boundaryMat);
        southBoundary.position.set(0, 2, -boundarySize);
        this.scene.add(southBoundary);
        this.boundaryWalls.push(southBoundary);
        this.objects.push(southBoundary);
        
        const eastBoundary = new THREE.Mesh(new THREE.BoxGeometry(1, boundaryHeight, boundarySize * 2), boundaryMat);
        eastBoundary.position.set(boundarySize, 2, 0);
        this.scene.add(eastBoundary);
        this.boundaryWalls.push(eastBoundary);
        this.objects.push(eastBoundary);
        
        const westBoundary = new THREE.Mesh(new THREE.BoxGeometry(1, boundaryHeight, boundarySize * 2), boundaryMat);
        westBoundary.position.set(-boundarySize, 2, 0);
        this.scene.add(westBoundary);
        this.boundaryWalls.push(westBoundary);
        this.objects.push(westBoundary);
        
        this.addRocks();
        this.addFlowers();
        
        const spawnMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.5, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x442200 })
        );
        spawnMarker.position.set(35, -0.4, 30);
        spawnMarker.castShadow = true;
        this.scene.add(spawnMarker);
        this.objects.push(spawnMarker);
        
        const markerLight = new THREE.PointLight(0xff6600, 0.8, 20);
        markerLight.position.set(35, 1, 30);
        this.scene.add(markerLight);
        this.objects.push(markerLight);
        
        console.log('📍 Остров создан');
    }
    
    setupSunLighting() {
        // Удаляем старый свет если есть
        if (this.sunLight) {
            this.scene.remove(this.sunLight);
        }
        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
        }
        
        // Ambient light - рассеянный свет (небо)
        this.ambientLight = new THREE.AmbientLight(0x88aadd, 0.6);
        this.scene.add(this.ambientLight);
        
        // Основной направленный свет (солнце)
        this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
        this.sunLight.position.set(30, 40, 20);
        this.sunLight.castShadow = true;
        this.sunLight.receiveShadow = false;
        
        // Настройка теней
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 100;
        this.sunLight.shadow.camera.left = -30;
        this.sunLight.shadow.camera.right = 30;
        this.sunLight.shadow.camera.top = 30;
        this.sunLight.shadow.camera.bottom = -30;
        this.scene.add(this.sunLight);
        
        // Добавляем вспомогательный свет для подсветки теней
        const fillLight = new THREE.PointLight(0x88aaff, 0.3);
        fillLight.position.set(0, 10, 0);
        this.scene.add(fillLight);
        this.objects.push(fillLight);
        
        // Добавляем теплый свет сзади
        const backLight = new THREE.PointLight(0xffaa66, 0.4);
        backLight.position.set(-20, 15, -30);
        this.scene.add(backLight);
        this.objects.push(backLight);
        
        console.log('☀️ Солнечное освещение настроено');
        
        // Анимация движения солнца (опционально)
        let time = 0;
        const animateSun = () => {
            requestAnimationFrame(animateSun);
            time += 0.002;
            // Солнце движется по дуге
            const x = Math.cos(time) * 40;
            const z = Math.sin(time) * 30;
            const y = 25 + Math.sin(time) * 15;
            this.sunLight.position.set(x, y, z);
        };
        // Раскомментировать если нужно движущееся солнце
        // animateSun();
    }
    
    loadCampfireGLB() {
        const campfirePath = 'assets/models/campfire.glb';
        
        this.gltfLoader.load(campfirePath, (gltf) => {
            console.log('✅ GLB модель костра загружена!');
            const campfire = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(campfire);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 0.8 / maxSize;
            
            campfire.scale.setScalar(scale);
            campfire.position.set(0, -0.2, 0);
            campfire.castShadow = true;
            
            this.scene.add(campfire);
            this.objects.push(campfire);
            
            const fireLight = new THREE.PointLight(0xff6600, 0.8, 15);
            fireLight.position.set(0, 0.5, 0);
            this.scene.add(fireLight);
            this.objects.push(fireLight);
            
            const animateFire = () => {
                requestAnimationFrame(animateFire);
                if (fireLight.parent) {
                    fireLight.intensity = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
                }
            };
            animateFire();
            
        }, (xhr) => {
            if (xhr.total) {
                console.log(`Загрузка костра: ${Math.floor(xhr.loaded / xhr.total * 100)}%`);
            }
        }, (error) => {
            console.warn('⚠️ Не удалось загрузить GLB модель костра, создаю стандартный');
            this.addCampfireStandard();
        });
    }
    
    addCampfireStandard() {
        const logMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a });
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
        
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x887a6a });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), stoneMat);
            stone.position.set(Math.cos(angle) * 0.8, -0.3, Math.sin(angle) * 0.8);
            stone.scale.setScalar(0.8);
            this.scene.add(stone);
            this.objects.push(stone);
        }
        
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-0.4, -0.2, 0.3);
        this.scene.add(log1);
        this.objects.push(log1);
        
        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log2.rotation.x = Math.PI / 2;
        log2.position.set(0.3, -0.2, -0.4);
        this.scene.add(log2);
        this.objects.push(log2);
        
        const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.2, 8), fireMat);
        fire.position.set(0, -0.1, 0);
        fire.castShadow = true;
        this.scene.add(fire);
        this.objects.push(fire);
        
        const light = new THREE.PointLight(0xff4400, 0.8, 15);
        light.position.set(0, 0.5, 0);
        this.scene.add(light);
        this.objects.push(light);
        
        const animateFire = () => {
            requestAnimationFrame(animateFire);
            if (fire.parent) {
                const intensity = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
                light.intensity = intensity;
                fire.scale.setScalar(1 + Math.sin(Date.now() * 0.015) * 0.15);
            }
        };
        animateFire();
    }
    
    loadBoatGLB() {
        const boatPath = 'assets/models/wooden_boat.glb';
        
        this.gltfLoader.load(boatPath, (gltf) => {
            console.log('✅ GLB модель лодки загружена!');
            const boat = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(boat);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 1.2 / maxSize;
            
            boat.scale.setScalar(scale);
            boat.position.set(42, -0.2, 38);
            boat.castShadow = true;
            boat.userData = { isBoat: true };
            
            boat.userData.onInteract = () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('boat');
                }
            };
            
            this.scene.add(boat);
            this.objects.push(boat);
            this.interactiveObjects.push(boat);
            
            const boatGlow = new THREE.PointLight(0x44aaff, 0.5, 12);
            boatGlow.position.set(42, 0.5, 38);
            this.scene.add(boatGlow);
            this.objects.push(boatGlow);
            
            console.log('🛶 Лодка готова к отплытию');
            
        }, (xhr) => {
            if (xhr.total) {
                console.log(`Загрузка лодки: ${Math.floor(xhr.loaded / xhr.total * 100)}%`);
            }
        }, (error) => {
            console.warn('⚠️ Не удалось загрузить GLB модель лодки, создаю стандартную');
            this.addBoatStandard();
        });
    }
    
    addBoatStandard() {
        const boatGroup = new THREE.Group();
        const boatMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        const boatBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 4), boatMat);
        boatBody.castShadow = true;
        boatGroup.add(boatBody);
        
        const boatFront = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 4), boatMat);
        boatFront.rotation.x = Math.PI / 2;
        boatFront.position.set(0, 0.2, 1.8);
        boatFront.castShadow = true;
        boatGroup.add(boatFront);
        
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2, 6), mastMat);
        mast.position.set(0, 1.2, 0);
        boatGroup.add(mast);
        
        const sailMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc });
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), sailMat);
        sail.position.set(0, 1.5, 0.1);
        sail.castShadow = true;
        boatGroup.add(sail);
        
        boatGroup.position.set(42, 0, 38);
        boatGroup.castShadow = true;
        boatGroup.userData = { isBoat: true };
        
        boatGroup.userData.onInteract = () => {
            if (window.gameInstance && window.gameInstance.handleInteraction) {
                window.gameInstance.handleInteraction('boat');
            }
        };
        
        this.scene.add(boatGroup);
        this.objects.push(boatGroup);
        this.interactiveObjects.push(boatGroup);
    }
    
    loadTreesWithVisibility() {
        const treePath = 'assets/models/date_palm.glb';
        
        const treePositions = [];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 38;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            treePositions.push({ x, z, scale: 0.7 + Math.random() * 0.6 });
        }
        
        this.gltfLoader.load(treePath, (gltf) => {
            console.log('✅ GLB модель пальмы загружена!');
            this.treeModel = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(this.treeModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const baseScale = 2.5 / maxSize;
            
            treePositions.forEach((pos) => {
                const tree = this.treeModel.clone();
                
                const finalScale = baseScale * pos.scale;
                tree.scale.setScalar(finalScale);
                tree.position.set(pos.x, -0.5, pos.z);
                tree.castShadow = true;
                tree.receiveShadow = true;
                tree.visible = false;
                
                this.scene.add(tree);
                this.objects.push(tree);
                this.treeInstances.push(tree);
            });
            
            console.log(`🌴 Создано ${treePositions.length} пальм (появляются при приближении)`);
            this.updateVisibility();
            
        }, (xhr) => {
            if (xhr.total) {
                const percent = Math.floor(xhr.loaded / xhr.total * 100);
                if (percent % 25 === 0) {
                    console.log(`Загрузка пальмы: ${percent}%`);
                }
            }
        }, (error) => {
            console.warn('⚠️ Не удалось загрузить GLB модель пальмы');
            this.createDefaultTreesOptimized();
        });
    }
    
    createDefaultTreesOptimized() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        
        const treePositions = [];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 38;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            treePositions.push([x, -0.5, z]);
        }
        
        treePositions.forEach((pos) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.3, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.6, pos[2]);
            trunk.castShadow = true;
            
            const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1, 8), foliageMat);
            foliage1.position.set(pos[0], pos[1] + 1.3, pos[2]);
            foliage1.castShadow = true;
            
            const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), foliageMat);
            foliage2.position.set(pos[0], pos[1] + 2, pos[2]);
            foliage2.castShadow = true;
            
            const treeGroup = new THREE.Group();
            treeGroup.add(trunk);
            treeGroup.add(foliage1);
            treeGroup.add(foliage2);
            treeGroup.position.set(pos[0], 0, pos[2]);
            treeGroup.visible = false;
            
            this.scene.add(treeGroup);
            this.objects.push(treeGroup);
            this.treeInstances.push(treeGroup);
        });
        
        console.log(`🌲 Создано ${treePositions.length} стандартных деревьев`);
        this.updateVisibility();
    }
    
    addRocks() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a });
        for (let i = 0; i < 60; i++) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), rockMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 12 + Math.random() * 42;
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = -0.45;
            rock.scale.setScalar(0.5 + Math.random() * 0.8);
            rock.castShadow = true;
            this.scene.add(rock);
            this.objects.push(rock);
        }
    }
    
    addFlowers() {
        const flowerColors = [0xffaa66, 0xff66aa, 0xaa66ff, 0xff6666];
        for (let i = 0; i < 200; i++) {
            const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const flowerMat = new THREE.MeshStandardMaterial({ color: color });
            const flower = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 6), flowerMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 48;
            flower.position.x = Math.cos(angle) * radius;
            flower.position.z = Math.sin(angle) * radius;
            flower.position.y = -0.48;
            flower.castShadow = true;
            this.scene.add(flower);
            this.objects.push(flower);
        }
    }
    
    clearScene() {
        this.objects.forEach(obj => {
            if (obj && obj.parent) {
                this.scene.remove(obj);
            }
        });
        this.objects = [];
        this.interactiveObjects = [];
        this.boundaryWalls = [];
        this.waterPlane = null;
        this.treeInstances = [];
    }
}
