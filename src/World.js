import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class World {
    constructor(scene, settings) {
        this.scene = scene;
        this.settings = settings || { shadows: true, brightness: 0.55 };
        this.interactiveObjects = [];
        this.objects = [];
        this.exitDoor = null;
        this.waterPlane = null;
        this.boundaryWalls = [];
        this.basementObjects = [];
        this.gltfLoader = new GLTFLoader();
        this.treeModel = null;
        this.treeInstances = [];
        this.loadDistance = 40;
        this.unloadDistance = 50;
        this.playerPosition = new THREE.Vector3(0, 0, 0);
        this.lastUpdateTime = 0;
        this.sunLight = null;
        this.ambientLight = null;
        
        this.textures = {
            stuccoWall: null,
            stuccoCeiling: null,
            sand: null,
            grass: null,
            laminate: null
        };
        
        this.cachedModels = {
            torch: null,
            key: null,
            palm: null,
            campfire: null,
            boat: null,
            barrel: null,
            door: null,
            canister: null
        };
        this.modelsLoading = {
            torch: false,
            key: false,
            palm: false,
            campfire: false,
            boat: false,
            barrel: false,
            door: false,
            canister: false
        };
        this.modelsLoaded = {
            torch: false,
            key: false,
            palm: false,
            campfire: false,
            boat: false,
            barrel: false,
            door: false,
            canister: false
        };
        
        this.preloadAllModels();
        this.loadTextures();
    }
    
    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        this.textures.stuccoWall = textureLoader.load('assets/textures/stucco-5.jpg');
        this.textures.stuccoWall.wrapS = THREE.RepeatWrapping;
        this.textures.stuccoWall.wrapT = THREE.RepeatWrapping;
        this.textures.stuccoWall.repeat.set(4, 3);
        
        this.textures.stuccoCeiling = textureLoader.load('assets/textures/stucco-9.jpg');
        this.textures.stuccoCeiling.wrapS = THREE.RepeatWrapping;
        this.textures.stuccoCeiling.wrapT = THREE.RepeatWrapping;
        this.textures.stuccoCeiling.repeat.set(3, 3);
        
        this.textures.sand = textureLoader.load('assets/textures/sand-1.jpg');
        this.textures.sand.wrapS = THREE.RepeatWrapping;
        this.textures.sand.wrapT = THREE.RepeatWrapping;
        this.textures.sand.repeat.set(6, 6);
        
        this.textures.grass = textureLoader.load('assets/textures/grass-2.jpg');
        this.textures.grass.wrapS = THREE.RepeatWrapping;
        this.textures.grass.wrapT = THREE.RepeatWrapping;
        this.textures.grass.repeat.set(8, 8);
        
        this.textures.laminate = textureLoader.load('assets/textures/laminate-2.jpg');
        this.textures.laminate.wrapS = THREE.RepeatWrapping;
        this.textures.laminate.wrapT = THREE.RepeatWrapping;
        this.textures.laminate.repeat.set(4, 4);
        
        console.log('🎨 Текстуры загружены');
    }
    
    preloadAllModels() {
        console.log('🔄 Начинаем предзагрузку всех моделей...');
        this.preloadModel('torch', 'assets/models/old_torch_with_wall_mounting.glb');
        this.preloadModel('key', 'assets/models/key.glb');
        this.preloadModel('palm', 'assets/models/date_palm.glb');
        this.preloadModel('campfire', 'assets/models/campfire.glb');
        this.preloadModel('boat', 'assets/models/wooden_boat.glb');
        this.preloadModel('barrel', 'assets/models/old_barrel_free_download.glb');
        this.preloadModel('door', 'assets/models/medieval_door.glb');
        this.preloadModel('canister', 'assets/models/canister.glb');
    }
    
    preloadModel(name, path) {
        if (this.modelsLoading[name]) return;
        this.modelsLoading[name] = true;
        
        this.gltfLoader.load(path, (gltf) => {
            console.log(`✅ Модель ${name} предзагружена`);
            this.cachedModels[name] = gltf.scene;
            this.modelsLoaded[name] = true;
            this.modelsLoading[name] = false;
        }, (xhr) => {
            if (xhr.total) {
                const percent = Math.floor(xhr.loaded / xhr.total * 100);
                if (percent % 50 === 0) {
                    console.log(`📦 Загрузка ${name}: ${percent}%`);
                }
            }
        }, (error) => {
            console.warn(`⚠️ Не удалось предзагрузить модель ${name}:`, error);
            this.modelsLoading[name] = false;
        });
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
        
        const floorMat = new THREE.MeshStandardMaterial({ map: this.textures.laminate, roughness: 0.6, metalness: 0.05 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = this.settings.shadows;
        this.scene.add(floor);
        this.basementObjects.push(floor);
        
        const wallMat = new THREE.MeshStandardMaterial({ map: this.textures.stuccoWall, roughness: 0.7 });
        
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 0.3), wallMat);
        backWall.position.set(0, 1.25, -9);
        backWall.receiveShadow = this.settings.shadows;
        this.scene.add(backWall);
        this.basementObjects.push(backWall);
        
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 0.3), wallMat);
        frontWall.position.set(0, 1.25, 9);
        frontWall.receiveShadow = this.settings.shadows;
        this.scene.add(frontWall);
        this.basementObjects.push(frontWall);
        
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 18), wallMat);
        leftWall.position.set(-9, 1.25, 0);
        leftWall.receiveShadow = this.settings.shadows;
        this.scene.add(leftWall);
        this.basementObjects.push(leftWall);
        
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 18), wallMat);
        rightWall.position.set(9, 1.25, 0);
        rightWall.receiveShadow = this.settings.shadows;
        this.scene.add(rightWall);
        this.basementObjects.push(rightWall);
        
        const ceilingMat = new THREE.MeshStandardMaterial({ map: this.textures.stuccoCeiling, roughness: 0.8 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 18), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        this.basementObjects.push(ceiling);
        
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.5 });
        for (let x = -6; x <= 6; x += 4) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 17.5), beamMat);
            beam.position.set(x, 2.75, 0);
            beam.castShadow = this.settings.shadows;
            this.scene.add(beam);
            this.basementObjects.push(beam);
        }
        
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.5 });
        const pillarPositions = [
            [-5, -0.2, -5], [5, -0.2, -5],
            [-5, -0.2, 5], [5, -0.2, 5],
            [-5, -0.2, 0], [5, -0.2, 0]
        ];
        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), pillarMat);
            pillar.position.set(pos[0], pos[1] + 1, pos[2]);
            pillar.castShadow = this.settings.shadows;
            this.scene.add(pillar);
            this.basementObjects.push(pillar);
        });
        
        this.addDoorFromCache();
        this.addBarrelsFromCache();
        this.addTorchesFromCache();
        
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.4 });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8), pedestalMat);
        pedestal.position.set(-3, -0.3, 4);
        pedestal.castShadow = this.settings.shadows;
        this.scene.add(pedestal);
        this.basementObjects.push(pedestal);
    }
    
    addDoorFromCache() {
        const addDoor = (doorModel) => {
            const box = new THREE.Box3().setFromObject(doorModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const desiredHeight = 2.2;
            const scale = desiredHeight / maxSize;
            
            doorModel.scale.setScalar(scale);
            doorModel.position.set(8, 0.1, -8.85);
            doorModel.castShadow = this.settings.shadows;
            doorModel.receiveShadow = this.settings.shadows;
            doorModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = this.settings.shadows;
                    child.receiveShadow = this.settings.shadows;
                }
            });
            
            this.exitDoor = doorModel;
            this.scene.add(doorModel);
            this.basementObjects.push(doorModel);
            
            console.log('🚪 Medieval door загружена');
        };
        
        if (this.modelsLoaded.door && this.cachedModels.door) {
            addDoor(this.cachedModels.door.clone());
        } else {
            this.addDefaultDoor();
            const checkInterval = setInterval(() => {
                if (this.modelsLoaded.door && this.cachedModels.door) {
                    clearInterval(checkInterval);
                    if (this.exitDoor && this.exitDoor.parent) {
                        this.scene.remove(this.exitDoor);
                    }
                    addDoor(this.cachedModels.door.clone());
                }
            }, 100);
        }
    }
    
    addDefaultDoor() {
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x7a5a4a });
        this.exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), doorMat);
        this.exitDoor.position.set(8, 0.1, -8.9);
        this.exitDoor.castShadow = this.settings.shadows;
        this.scene.add(this.exitDoor);
        this.basementObjects.push(this.exitDoor);
        
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x6a4a3a });
        const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.3), frameMat);
        frameLeft.position.set(7.35, 1.2, -8.9);
        const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.3), frameMat);
        frameRight.position.set(8.65, 1.2, -8.9);
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.3), frameMat);
        frameTop.position.set(8, 2.35, -8.9);
        this.scene.add(frameLeft);
        this.scene.add(frameRight);
        this.scene.add(frameTop);
        this.basementObjects.push(frameLeft, frameRight, frameTop);
    }
    
    addBarrelsFromCache() {
        const barrelPositions = [
            { x: -4, z: 3, rot: 0 },
            { x: 4, z: 3, rot: 0 },
            { x: -4, z: -2, rot: 0.5 },
            { x: 4, z: -2, rot: -0.3 },
            { x: 0, z: -4, rot: 0.2 },
            { x: 0, z: 5, rot: -0.2 },
            { x: -2, z: -5, rot: 0.4 },
            { x: 2, z: -5, rot: -0.4 }
        ];
        
        const addBarrel = (barrelModel) => {
            const box = new THREE.Box3().setFromObject(barrelModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const desiredSize = 0.9;
            const scale = desiredSize / maxSize;
            
            barrelPositions.forEach(pos => {
                const barrel = barrelModel.clone();
                barrel.scale.setScalar(scale);
                barrel.position.set(pos.x, -0.2, pos.z);
                barrel.rotation.y = pos.rot;
                barrel.castShadow = this.settings.shadows;
                barrel.receiveShadow = this.settings.shadows;
                barrel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = this.settings.shadows;
                        child.receiveShadow = this.settings.shadows;
                    }
                });
                
                this.scene.add(barrel);
                this.basementObjects.push(barrel);
            });
            console.log(`🛢️ Добавлено ${barrelPositions.length} GLB бочек`);
        };
        
        if (this.modelsLoaded.barrel && this.cachedModels.barrel) {
            addBarrel(this.cachedModels.barrel.clone());
        } else {
            this.addBarrelsStandard();
            const checkInterval = setInterval(() => {
                if (this.modelsLoaded.barrel && this.cachedModels.barrel) {
                    clearInterval(checkInterval);
                    this.basementObjects.forEach(obj => {
                        if (obj.isBarrelStandard) this.scene.remove(obj);
                    });
                    addBarrel(this.cachedModels.barrel.clone());
                }
            }, 100);
        }
    }
    
    addBarrelsStandard() {
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x6a4a3a });
        const positions = [
            [-4, -0.1, 3], [4, -0.1, 3],
            [-4, -0.1, -2], [4, -0.1, -2],
            [0, -0.1, -4], [0, -0.1, 5],
            [-2, -0.1, -5], [2, -0.1, -5]
        ];
        positions.forEach(pos => {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.8, 8), barrelMat);
            barrel.position.set(pos[0], pos[1], pos[2]);
            barrel.castShadow = this.settings.shadows;
            barrel.isBarrelStandard = true;
            this.scene.add(barrel);
            this.basementObjects.push(barrel);
        });
    }
    
    addTorchesFromCache() {
        const torchPositions = [
            [-8.7, 1.5, -6], [8.7, 1.5, -6],
            [-8.7, 1.5, 6], [8.7, 1.5, 6]
        ];
        
        const addTorch = (torchModel) => {
            torchPositions.forEach(pos => {
                const torch = torchModel.clone();
                
                const box = new THREE.Box3().setFromObject(torch);
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                const scale = 0.6 / maxSize;
                
                torch.scale.setScalar(scale);
                torch.position.set(pos[0], pos[1], pos[2]);
                torch.castShadow = this.settings.shadows;
                torch.receiveShadow = this.settings.shadows;
                torch.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = this.settings.shadows;
                        child.receiveShadow = this.settings.shadows;
                    }
                });
                
                if (Math.abs(pos[0]) > 8) {
                    torch.rotation.y = pos[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
                }
                
                this.scene.add(torch);
                this.basementObjects.push(torch);
                
                const light = new THREE.PointLight(0xff6633, 0.3, 7);
                light.position.set(pos[0], pos[1] + 0.2, pos[2]);
                light.castShadow = this.settings.shadows;
                this.scene.add(light);
                this.basementObjects.push(light);
                
                const animateLight = () => {
                    requestAnimationFrame(animateLight);
                    if (light.parent) {
                        light.intensity = 0.2 + Math.sin(Date.now() * 0.008) * 0.1;
                    }
                };
                animateLight();
            });
        };
        
        if (this.modelsLoaded.torch && this.cachedModels.torch) {
            addTorch(this.cachedModels.torch.clone());
        } else {
            this.addTorchesStandard();
            const checkInterval = setInterval(() => {
                if (this.modelsLoaded.torch && this.cachedModels.torch) {
                    clearInterval(checkInterval);
                    this.basementObjects.forEach(obj => {
                        if (obj.isTorchStandard) this.scene.remove(obj);
                    });
                    addTorch(this.cachedModels.torch.clone());
                }
            }, 100);
        }
    }
    
    addTorchesStandard() {
        const torchMat = new THREE.MeshStandardMaterial({ color: 0xaa6633 });
        const torchPositions = [
            [-8.7, 1.5, -6], [8.7, 1.5, -6],
            [-8.7, 1.5, 6], [8.7, 1.5, 6]
        ];
        
        torchPositions.forEach(pos => {
            const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6), torchMat);
            torch.position.set(pos[0], pos[1], pos[2]);
            torch.castShadow = this.settings.shadows;
            torch.isTorchStandard = true;
            this.scene.add(torch);
            this.basementObjects.push(torch);
            
            const flameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), flameMat);
            flame.position.set(pos[0], pos[1] + 0.5, pos[2]);
            this.scene.add(flame);
            this.basementObjects.push(flame);
            
            const light = new THREE.PointLight(0xff6633, 0.25, 6);
            light.position.set(pos[0], pos[1] + 0.3, pos[2]);
            this.scene.add(light);
            this.basementObjects.push(light);
        });
    }
    
    createInteractiveObjects(interactCallback) {
        const addKey = (keyModel) => {
            const box = new THREE.Box3().setFromObject(keyModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const desiredSize = 0.25;
            const scale = desiredSize / maxSize;
            
            keyModel.scale.setScalar(scale);
            keyModel.position.set(-3, 0, 4);
            keyModel.castShadow = this.settings.shadows;
            keyModel.receiveShadow = this.settings.shadows;
            keyModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = this.settings.shadows;
                    child.receiveShadow = this.settings.shadows;
                }
            });
            
            const newBox = new THREE.Box3().setFromObject(keyModel);
            const minY = newBox.min.y;
            keyModel.position.y += -minY + 0.15;
            
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
                }
            };
            animateKey();
            
            const glowLight = new THREE.PointLight(0xffaa44, 0.2, 3);
            glowLight.position.set(-3, 0.3, 4);
            this.scene.add(glowLight);
            this.basementObjects.push(glowLight);
            
            const animateLight = () => {
                requestAnimationFrame(animateLight);
                if (glowLight.parent) {
                    glowLight.intensity = 0.12 + Math.sin(Date.now() * 0.005) * 0.08;
                }
            };
            animateLight();
        };
        
        if (this.modelsLoaded.key && this.cachedModels.key) {
            addKey(this.cachedModels.key.clone());
        } else {
            this.createDefaultKey(interactCallback);
            const checkInterval = setInterval(() => {
                if (this.modelsLoaded.key && this.cachedModels.key) {
                    clearInterval(checkInterval);
                    const oldKey = this.basementObjects.find(obj => obj.userData && obj.userData.isDefaultKey);
                    if (oldKey) this.scene.remove(oldKey);
                    addKey(this.cachedModels.key.clone());
                }
            }, 100);
        }
    }
    
    createDefaultKey(interactCallback) {
        const keyGroup = new THREE.Group();
        
        const ringGeo = new THREE.TorusGeometry(0.18, 0.05, 16, 32);
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.9, roughness: 0.2 });
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
        
        keyGroup.position.set(-3, 0.15, 4);
        keyGroup.castShadow = this.settings.shadows;
        keyGroup.userData = { isDefaultKey: true, onInteract: () => interactCallback('key') };
        
        this.scene.add(keyGroup);
        this.basementObjects.push(keyGroup);
        this.interactiveObjects.push(keyGroup);
        
        const glowLight = new THREE.PointLight(0xffaa44, 0.2, 3);
        glowLight.position.set(-3, 0.35, 4);
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        const animateKey = () => {
            requestAnimationFrame(animateKey);
            if (keyGroup.parent) {
                keyGroup.position.y = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
                keyGroup.rotation.y += 0.02;
                glowLight.intensity = 0.12 + Math.sin(Date.now() * 0.005) * 0.08;
            }
        };
        animateKey();
    }
    
    showExitDoor() {
        if (this.exitDoor) {
            this.exitDoor.userData = {
                onInteract: () => {
                    if (window.gameInstance && window.gameInstance.handleInteraction) {
                        window.gameInstance.handleInteraction('door');
                    }
                }
            };
            this.interactiveObjects.push(this.exitDoor);
        }
        
        const glowLight = new THREE.PointLight(0xffaa44, 0.25, 4);
        if (this.exitDoor) {
            glowLight.position.copy(this.exitDoor.position);
        } else {
            glowLight.position.set(8, 1, -8.9);
        }
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        const animateGlow = () => {
            requestAnimationFrame(animateGlow);
            if (glowLight.parent) {
                glowLight.intensity = 0.15 + Math.sin(Date.now() * 0.004) * 0.1;
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
        
        this.scene.background = new THREE.Color(0x6a8aad);
        this.scene.fog = new THREE.FogExp2(0x6a8aad, 0.003);
        
        this.setupSunLighting();
        
        const groundMat = new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = this.settings.shadows;
        this.scene.add(ground);
        this.objects.push(ground);
        
        const sandMat = new THREE.MeshStandardMaterial({ map: this.textures.sand, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(45, 50, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = this.settings.shadows;
        this.scene.add(sandRing);
        this.objects.push(sandRing);
        
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x5a8a4a, roughness: 0.8 });
        for (let i = 0; i < 40; i++) {
            const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.4, 8), hillMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 35;
            hill.position.x = Math.cos(angle) * radius;
            hill.position.z = Math.sin(angle) * radius;
            hill.position.y = -0.35;
            hill.castShadow = this.settings.shadows;
            this.scene.add(hill);
            this.objects.push(hill);
        }
        
        this.createTreesFromCache();
        this.addCampfireFromCache();
        this.addBoatFromCache();
        
        const waterMat = new THREE.MeshStandardMaterial({ 
            color: 0x4488cc, 
            metalness: 0.8, 
            roughness: 0.3, 
            transparent: true, 
            opacity: 0.85 
        });
        this.waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), waterMat);
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.y = -0.6;
        this.waterPlane.receiveShadow = false;
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
            new THREE.MeshStandardMaterial({ color: 0xcc5500, emissive: 0x331100 })
        );
        spawnMarker.position.set(35, -0.4, 30);
        spawnMarker.castShadow = this.settings.shadows;
        this.scene.add(spawnMarker);
        this.objects.push(spawnMarker);
        
        const markerLight = new THREE.PointLight(0xff6600, 0.35, 15);
        markerLight.position.set(35, 1, 30);
        this.scene.add(markerLight);
        this.objects.push(markerLight);
        
        console.log('📍 Остров создан');
    }
    
    setupSunLighting() {
        if (this.sunLight) this.scene.remove(this.sunLight);
        if (this.ambientLight) this.scene.remove(this.ambientLight);
        
        const brightness = this.settings.brightness !== undefined ? this.settings.brightness : 0.55;
        
        this.ambientLight = new THREE.AmbientLight(0x88aacc, brightness * 0.5);
        this.scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xffdd99, brightness);
        this.sunLight.position.set(30, 30, 20);
        this.sunLight.castShadow = this.settings.shadows;
        this.sunLight.receiveShadow = false;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 80;
        this.sunLight.shadow.camera.left = -25;
        this.sunLight.shadow.camera.right = 25;
        this.sunLight.shadow.camera.top = 25;
        this.sunLight.shadow.camera.bottom = -25;
        this.scene.add(this.sunLight);
        
        console.log('☀️ Освещение настроено, яркость:', brightness);
    }
    
    createTreesFromCache() {
        const treePositions = [];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 38;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            treePositions.push({ x, z, scale: 0.7 + Math.random() * 0.6 });
        }
        
        const addTrees = (treeModel) => {
            const box = new THREE.Box3().setFromObject(treeModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const baseScale = 3.2 / maxSize;
            
            treePositions.forEach((pos) => {
                const tree = treeModel.clone();
                const finalScale = baseScale * pos.scale;
                tree.scale.setScalar(finalScale);
                tree.position.set(pos.x, -0.5, pos.z);
                tree.castShadow = this.settings.shadows;
                tree.receiveShadow = this.settings.shadows;
                tree.visible = false;
                tree.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = this.settings.shadows;
                        child.receiveShadow = this.settings.shadows;
                    }
                });
                
                this.scene.add(tree);
                this.objects.push(tree);
                this.treeInstances.push(tree);
            });
            
            console.log(`🌴 Создано ${treePositions.length} увеличенных пальм`);
            this.updateVisibility();
        };
        
        if (this.modelsLoaded.palm && this.cachedModels.palm) {
            addTrees(this.cachedModels.palm);
        } else {
            this.createDefaultTreesOptimized();
            const checkInterval = setInterval(() => {
                if (this.modelsLoaded.palm && this.cachedModels.palm) {
                    clearInterval(checkInterval);
                    this.treeInstances.forEach(tree => {
                        if (tree.parent) this.scene.remove(tree);
                    });
                    this.treeInstances = [];
                    addTrees(this.cachedModels.palm);
                }
            }, 100);
        }
    }
    
    createDefaultTreesOptimized() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a });
        
        const treePositions = [];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 38;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            treePositions.push([x, -0.5, z]);
        }
        
        treePositions.forEach((pos) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.6, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.8, pos[2]);
            trunk.castShadow = this.settings.shadows;
            
            const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 8), foliageMat);
            foliage1.position.set(pos[0], pos[1] + 1.7, pos[2]);
            foliage1.castShadow = this.settings.shadows;
            
            const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 8), foliageMat);
            foliage2.position.set(pos[0], pos[1] + 2.5, pos[2]);
            foliage2.castShadow = this.settings.shadows;
            
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
        
        console.log(`🌲 Создано ${treePositions.length} увеличенных стандартных деревьев`);
        this.updateVisibility();
    }
    
    addCampfireFromCache() {
        const addCampfire = (campfireModel) => {
            const box = new THREE.Box3().setFromObject(campfireModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 0.7 / maxSize;
            
            campfireModel.scale.setScalar(scale);
            campfireModel.position.set(0, -0.2, 0);
            campfireModel.castShadow = this.settings.shadows;
            campfireModel.receiveShadow = this.settings.shadows;
            campfireModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = this.settings.shadows;
                    child.receiveShadow = this.settings.shadows;
                }
            });
            
            this.scene.add(campfireModel);
            this.objects.push(campfireModel);
            
            const fireLight = new THREE.PointLight(0xff6600, 0.45, 12);
            fireLight.position.set(0, 0.4, 0);
            fireLight.castShadow = this.settings.shadows;
            this.scene.add(fireLight);
            this.objects.push(fireLight);
            
            const animateFire = () => {
                requestAnimationFrame(animateFire);
                if (fireLight.parent) {
                    fireLight.intensity = 0.35 + Math.sin(Date.now() * 0.01) * 0.2;
                }
            };
            animateFire();
        };
        
        if (this.modelsLoaded.campfire && this.cachedModels.campfire) {
            addCampfire(this.cachedModels.campfire.clone());
        } else {
            this.addCampfireStandard();
        }
    }
    
    addCampfireStandard() {
        const logMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a });
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
        
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x887a6a });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), stoneMat);
            stone.position.set(Math.cos(angle) * 0.8, -0.3, Math.sin(angle) * 0.8);
            stone.scale.setScalar(0.8);
            stone.castShadow = this.settings.shadows;
            this.scene.add(stone);
            this.objects.push(stone);
        }
        
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-0.4, -0.2, 0.3);
        log1.castShadow = this.settings.shadows;
        this.scene.add(log1);
        this.objects.push(log1);
        
        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log2.rotation.x = Math.PI / 2;
        log2.position.set(0.3, -0.2, -0.4);
        log2.castShadow = this.settings.shadows;
        this.scene.add(log2);
        this.objects.push(log2);
        
        const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.2, 8), fireMat);
        fire.position.set(0, -0.1, 0);
        fire.castShadow = this.settings.shadows;
        this.scene.add(fire);
        this.objects.push(fire);
        
        const light = new THREE.PointLight(0xff4400, 0.45, 12);
        light.position.set(0, 0.4, 0);
        this.scene.add(light);
        this.objects.push(light);
        
        const animateFire = () => {
            requestAnimationFrame(animateFire);
            if (fire.parent) {
                const intensity = 0.35 + Math.sin(Date.now() * 0.01) * 0.2;
                light.intensity = intensity;
                fire.scale.setScalar(1 + Math.sin(Date.now() * 0.015) * 0.15);
            }
        };
        animateFire();
    }
    
    addBoatFromCache() {
        const addBoat = (boatModel) => {
            const box = new THREE.Box3().setFromObject(boatModel);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 1.8 / maxSize;
            
            boatModel.scale.setScalar(scale);
            boatModel.position.set(42, -0.15, 38);
            boatModel.castShadow = this.settings.shadows;
            boatModel.receiveShadow = this.settings.shadows;
            boatModel.userData = { isBoat: true };
            boatModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = this.settings.shadows;
                    child.receiveShadow = this.settings.shadows;
                }
            });
            
            boatModel.userData.onInteract = () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('boat');
                }
            };
            
            this.scene.add(boatModel);
            this.objects.push(boatModel);
            this.interactiveObjects.push(boatModel);
            
            const boatGlow = new THREE.PointLight(0x44aaff, 0.25, 10);
            boatGlow.position.set(42, 0.5, 38);
            this.scene.add(boatGlow);
            this.objects.push(boatGlow);
            
            console.log('🛶 Лодка готова к отплытию');
        };
        
        if (this.modelsLoaded.boat && this.cachedModels.boat) {
            addBoat(this.cachedModels.boat.clone());
        } else {
            this.addBoatStandard();
        }
    }
    
    addBoatStandard() {
        const boatGroup = new THREE.Group();
        const boatMat = new THREE.MeshStandardMaterial({ color: 0x7a5a4a });
        const boatBody = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 5), boatMat);
        boatBody.castShadow = this.settings.shadows;
        boatGroup.add(boatBody);
        
        const boatFront = new THREE.Mesh(new THREE.ConeGeometry(1, 1.2, 4), boatMat);
        boatFront.rotation.x = Math.PI / 2;
        boatFront.position.set(0, 0.3, 2.2);
        boatFront.castShadow = this.settings.shadows;
        boatGroup.add(boatFront);
        
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 2.5, 6), mastMat);
        mast.position.set(0, 1.5, 0);
        boatGroup.add(mast);
        
        const sailMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc });
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2), sailMat);
        sail.position.set(0, 1.8, 0.15);
        sail.castShadow = this.settings.shadows;
        boatGroup.add(sail);
        
        boatGroup.position.set(42, 0, 38);
        boatGroup.castShadow = this.settings.shadows;
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
    
    addRocks() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.8 });
        for (let i = 0; i < 60; i++) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), rockMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 12 + Math.random() * 42;
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = -0.45;
            rock.scale.setScalar(0.5 + Math.random() * 0.8);
            rock.castShadow = this.settings.shadows;
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
            flower.castShadow = this.settings.shadows;
            this.scene.add(flower);
            this.objects.push(flower);
        }
    }
    
    // НОВЫЙ МЕТОД ДЛЯ СПАВНА КАНИСТРЫ
    spawnCanister(callback) {
        const spawn = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 0.6 / maxSize;
            model.scale.setScalar(scale);
            
            // Случайная позиция на острове (не слишком близко к лодке)
            let x, z;
            do {
                const angle = Math.random() * Math.PI * 2;
                const radius = 15 + Math.random() * 25;
                x = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
            } while (Math.hypot(x - 42, z - 38) < 8);
            
            model.position.set(x, -0.2, z);
            model.castShadow = this.settings.shadows;
            model.receiveShadow = this.settings.shadows;
            model.userData = {
                onInteract: () => callback()
            };
            this.scene.add(model);
            this.objects.push(model);
            this.interactiveObjects.push(model);
            
            // Анимация парения
            const startY = model.position.y;
            const animate = () => {
                requestAnimationFrame(animate);
                if (model.parent) {
                    model.position.y = startY + Math.sin(Date.now() * 0.003) * 0.1;
                    model.rotation.y += 0.01;
                }
            };
            animate();
            
            // Световой эффект
            const glow = new THREE.PointLight(0xffaa66, 0.4, 5);
            glow.position.copy(model.position);
            this.scene.add(glow);
            this.objects.push(glow);
            
            console.log('⛽ Канистра с бензином появилась на острове');
        };
        
        if (this.modelsLoaded.canister && this.cachedModels.canister) {
            spawn(this.cachedModels.canister.clone());
        } else {
            // Фолбэк – простая коробка
            const geometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
            const material = new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.6 });
            const dummy = new THREE.Mesh(geometry, material);
            dummy.castShadow = this.settings.shadows;
            spawn(dummy);
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
