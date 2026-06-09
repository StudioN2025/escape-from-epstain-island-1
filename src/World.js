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
        
        this.collidables = [];
        
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
            canister: null,
            house: null
        };
        this.modelsLoading = {
            torch: false,
            key: false,
            palm: false,
            campfire: false,
            boat: false,
            barrel: false,
            door: false,
            canister: false,
            house: false
        };
        this.modelsLoaded = {
            torch: false,
            key: false,
            palm: false,
            campfire: false,
            boat: false,
            barrel: false,
            door: false,
            canister: false,
            house: false
        };
        
        this.preloadAllModels();
        this.loadTextures();
    }
    
    resolveCollision(position) {
        let newPos = position.clone();
        for (let obstacle of this.collidables) {
            if (obstacle.type === 'box') {
                const halfSize = obstacle.halfSize;
                const min = new THREE.Vector3(obstacle.x - halfSize.x, obstacle.y - halfSize.y, obstacle.z - halfSize.z);
                const max = new THREE.Vector3(obstacle.x + halfSize.x, obstacle.y + halfSize.y, obstacle.z + halfSize.z);
                if (newPos.x > min.x && newPos.x < max.x && newPos.z > min.z && newPos.z < max.z) {
                    const dxL = newPos.x - min.x;
                    const dxR = max.x - newPos.x;
                    const dzL = newPos.z - min.z;
                    const dzR = max.z - newPos.z;
                    const minDist = Math.min(dxL, dxR, dzL, dzR);
                    if (minDist === dxL) newPos.x = min.x - 0.01;
                    else if (minDist === dxR) newPos.x = max.x + 0.01;
                    else if (minDist === dzL) newPos.z = min.z - 0.01;
                    else if (minDist === dzR) newPos.z = max.z + 0.01;
                }
            } else if (obstacle.type === 'cylinder') {
                const dx = newPos.x - obstacle.x;
                const dz = newPos.z - obstacle.z;
                const dist = Math.sqrt(dx*dx + dz*dz);
                if (dist < obstacle.radius) {
                    const angle = Math.atan2(dz, dx);
                    newPos.x = obstacle.x + Math.cos(angle) * obstacle.radius;
                    newPos.z = obstacle.z + Math.sin(angle) * obstacle.radius;
                }
            }
        }
        return newPos;
    }
    
    loadTextures() {
        const loader = new THREE.TextureLoader();
        this.textures.stuccoWall = loader.load('assets/textures/stucco-5.jpg');
        this.textures.stuccoWall.wrapS = THREE.RepeatWrapping;
        this.textures.stuccoWall.wrapT = THREE.RepeatWrapping;
        this.textures.stuccoWall.repeat.set(4, 3);
        this.textures.stuccoCeiling = loader.load('assets/textures/stucco-9.jpg');
        this.textures.stuccoCeiling.wrapS = THREE.RepeatWrapping;
        this.textures.stuccoCeiling.wrapT = THREE.RepeatWrapping;
        this.textures.stuccoCeiling.repeat.set(3, 3);
        this.textures.sand = loader.load('assets/textures/sand-1.jpg');
        this.textures.sand.wrapS = THREE.RepeatWrapping;
        this.textures.sand.wrapT = THREE.RepeatWrapping;
        this.textures.sand.repeat.set(6, 6);
        this.textures.grass = loader.load('assets/textures/grass-2.jpg');
        this.textures.grass.wrapS = THREE.RepeatWrapping;
        this.textures.grass.wrapT = THREE.RepeatWrapping;
        this.textures.grass.repeat.set(8, 8);
        this.textures.laminate = loader.load('assets/textures/laminate-2.jpg');
        this.textures.laminate.wrapS = THREE.RepeatWrapping;
        this.textures.laminate.wrapT = THREE.RepeatWrapping;
        this.textures.laminate.repeat.set(4, 4);
        console.log('🎨 Текстуры загружены');
    }
    
    preloadAllModels() {
        console.log('🔄 Предзагрузка моделей...');
        this.preloadModel('torch', 'assets/models/old_torch_with_wall_mounting.glb');
        this.preloadModel('key', 'assets/models/key.glb');
        this.preloadModel('palm', 'assets/models/date_palm.glb');
        this.preloadModel('campfire', 'assets/models/campfire.glb');
        this.preloadModel('boat', 'assets/models/wooden_boat.glb');
        this.preloadModel('barrel', 'assets/models/old_barrel_free_download.glb');
        this.preloadModel('door', 'assets/models/medieval_door.glb');
        this.preloadModel('canister', 'assets/models/canister.glb');
        this.preloadModel('house', 'assets/models/house.glb');
    }
    
    preloadModel(name, path) {
        if (this.modelsLoading[name]) return;
        this.modelsLoading[name] = true;
        this.gltfLoader.load(path, (gltf) => {
            console.log(`✅ Модель ${name} загружена`);
            this.cachedModels[name] = gltf.scene;
            this.modelsLoaded[name] = true;
            this.modelsLoading[name] = false;
        }, (xhr) => {
            if (xhr.total) {
                const pct = Math.floor(xhr.loaded / xhr.total * 100);
                if (pct % 50 === 0) console.log(`📦 ${name}: ${pct}%`);
            }
        }, (err) => {
            console.warn(`⚠️ Ошибка загрузки ${name}:`, err);
            this.modelsLoading[name] = false;
        });
    }
    
    updatePlayerPosition(pos) {
        this.playerPosition.copy(pos);
        const now = Date.now();
        if (now - this.lastUpdateTime > 100) {
            this.lastUpdateTime = now;
            this.updateVisibility();
        }
    }
    
    updateVisibility() {
        this.treeInstances.forEach(t => {
            t.visible = this.playerPosition.distanceTo(t.position) < this.loadDistance;
        });
        this.objects.forEach(obj => {
            if (obj.userData?.isBoat) {
                obj.visible = this.playerPosition.distanceTo(obj.position) < this.loadDistance + 10;
            }
        });
    }
    
    // ========== ПОДВАЛ ==========
    async createBasement() {
        this.clearBasement();
        this.collidables = [];
        
        const floorMat = new THREE.MeshStandardMaterial({ map: this.textures.laminate, roughness: 0.6 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = this.settings.shadows;
        this.scene.add(floor);
        this.basementObjects.push(floor);
        
        const wallMat = new THREE.MeshStandardMaterial({ map: this.textures.stuccoWall, roughness: 0.7 });
        const walls = [
            { pos: [0, 1.25, -9], scale: [18, 3.5, 0.3] },
            { pos: [0, 1.25, 9], scale: [18, 3.5, 0.3] },
            { pos: [-9, 1.25, 0], scale: [0.3, 3.5, 18] },
            { pos: [9, 1.25, 0], scale: [0.3, 3.5, 18] }
        ];
        walls.forEach(w => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.scale), wallMat);
            wall.position.set(w.pos[0], w.pos[1], w.pos[2]);
            wall.receiveShadow = this.settings.shadows;
            this.scene.add(wall);
            this.basementObjects.push(wall);
        });
        
        const ceilingMat = new THREE.MeshStandardMaterial({ map: this.textures.stuccoCeiling, roughness: 0.8 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 18), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        this.basementObjects.push(ceiling);
        
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
        for (let x = -6; x <= 6; x += 4) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 17.5), beamMat);
            beam.position.set(x, 2.75, 0);
            beam.castShadow = this.settings.shadows;
            this.scene.add(beam);
            this.basementObjects.push(beam);
        }
        
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
        const pillars = [[-5,0, -5], [5,0,-5], [-5,0,5], [5,0,5], [-5,0,0], [5,0,0]];
        pillars.forEach(p => {
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), pillarMat);
            pillar.position.set(p[0], p[1] + 1, p[2]);
            pillar.castShadow = this.settings.shadows;
            this.scene.add(pillar);
            this.basementObjects.push(pillar);
            this.collidables.push({
                type: 'box',
                x: p[0], y: p[1]+1, z: p[2],
                halfSize: new THREE.Vector3(0.3, 1.25, 0.3)
            });
        });
        
        this.addDoorFromCache();
        this.addBarrelsFromCache();
        this.addTorchesFromCache();
        
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8), pedestalMat);
        pedestal.position.set(-3, -0.3, 4);
        pedestal.castShadow = this.settings.shadows;
        this.scene.add(pedestal);
        this.basementObjects.push(pedestal);
    }
    
    addDoorFromCache() {
        const addDoor = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const scale = 2.2 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.set(8, 0.1, -8.85);
            model.castShadow = this.settings.shadows;
            model.receiveShadow = this.settings.shadows;
            model.traverse(c => { if(c.isMesh) { c.castShadow = this.settings.shadows; c.receiveShadow = this.settings.shadows; } });
            this.exitDoor = model;
            this.scene.add(model);
            this.basementObjects.push(model);
            console.log('🚪 Дверь загружена');
        };
        if (this.modelsLoaded.door && this.cachedModels.door) {
            addDoor(this.cachedModels.door.clone());
        } else {
            this.addDefaultDoor();
            const check = setInterval(() => {
                if (this.modelsLoaded.door && this.cachedModels.door) {
                    clearInterval(check);
                    if (this.exitDoor && this.exitDoor.parent) this.scene.remove(this.exitDoor);
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
        this.scene.add(frameLeft, frameRight, frameTop);
        this.basementObjects.push(frameLeft, frameRight, frameTop);
    }
    
    addBarrelsFromCache() {
        const positions = [
            {x:-4,z:3,rot:0},{x:4,z:3,rot:0},{x:-4,z:-2,rot:0.5},{x:4,z:-2,rot:-0.3},
            {x:0,z:-4,rot:0.2},{x:0,z:5,rot:-0.2},{x:-2,z:-5,rot:0.4},{x:2,z:-5,rot:-0.4}
        ];
        const add = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            const scale = 0.9 / maxDim;
            positions.forEach(p => {
                const b = model.clone();
                b.scale.setScalar(scale);
                b.position.set(p.x, -0.2, p.z);
                b.rotation.y = p.rot;
                b.castShadow = this.settings.shadows;
                b.traverse(c => { if(c.isMesh) c.castShadow = this.settings.shadows; });
                this.scene.add(b);
                this.basementObjects.push(b);
                this.collidables.push({ type: 'cylinder', x: p.x, z: p.z, radius: 0.45 });
            });
            console.log(`🛢️ Добавлено ${positions.length} бочек`);
        };
        if (this.modelsLoaded.barrel && this.cachedModels.barrel) {
            add(this.cachedModels.barrel.clone());
        } else {
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x6a4a3a });
            positions.forEach(p => {
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.55,0.8,8), barrelMat);
                barrel.position.set(p.x, -0.1, p.z);
                barrel.rotation.y = p.rot;
                barrel.castShadow = this.settings.shadows;
                barrel.isBarrelStandard = true;
                this.scene.add(barrel);
                this.basementObjects.push(barrel);
                this.collidables.push({ type: 'cylinder', x: p.x, z: p.z, radius: 0.5 });
            });
            const check = setInterval(() => {
                if (this.modelsLoaded.barrel && this.cachedModels.barrel) {
                    clearInterval(check);
                    this.basementObjects.forEach(obj => { if(obj.isBarrelStandard) this.scene.remove(obj); });
                    add(this.cachedModels.barrel.clone());
                }
            }, 100);
        }
    }
    
    addTorchesFromCache() {
        const positions = [[-8.7,1.5,-6],[8.7,1.5,-6],[-8.7,1.5,6],[8.7,1.5,6]];
        const add = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            const scale = 0.6 / maxDim;
            positions.forEach(pos => {
                const torch = model.clone();
                torch.scale.setScalar(scale);
                torch.position.set(pos[0], pos[1], pos[2]);
                torch.castShadow = this.settings.shadows;
                if (Math.abs(pos[0])>8) torch.rotation.y = pos[0]>0 ? -Math.PI/2 : Math.PI/2;
                this.scene.add(torch);
                this.basementObjects.push(torch);
                const light = new THREE.PointLight(0xff6633, 0.3, 7);
                light.position.set(pos[0], pos[1]+0.2, pos[2]);
                this.scene.add(light);
                this.basementObjects.push(light);
                const animate = () => {
                    requestAnimationFrame(animate);
                    if(light.parent) light.intensity = 0.2 + Math.sin(Date.now()*0.008)*0.1;
                };
                animate();
            });
            console.log(`🕯️ Факелы добавлены`);
        };
        if (this.modelsLoaded.torch && this.cachedModels.torch) {
            add(this.cachedModels.torch.clone());
        } else {
            const torchMat = new THREE.MeshStandardMaterial({ color: 0xaa6633 });
            positions.forEach(pos => {
                const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,0.8,6), torchMat);
                torch.position.set(pos[0], pos[1], pos[2]);
                torch.castShadow = this.settings.shadows;
                this.scene.add(torch);
                this.basementObjects.push(torch);
                const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12,0.25,6), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 }));
                flame.position.set(pos[0], pos[1]+0.5, pos[2]);
                this.scene.add(flame);
                this.basementObjects.push(flame);
                const light = new THREE.PointLight(0xff6633, 0.25, 6);
                light.position.set(pos[0], pos[1]+0.3, pos[2]);
                this.scene.add(light);
                this.basementObjects.push(light);
            });
            const check = setInterval(() => {
                if (this.modelsLoaded.torch && this.cachedModels.torch) {
                    clearInterval(check);
                    this.basementObjects.forEach(obj => { if(obj.isTorchStandard) this.scene.remove(obj); });
                    add(this.cachedModels.torch.clone());
                }
            }, 100);
        }
    }
    
    createInteractiveObjects(callback) {
        const addKey = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            const scale = 0.25 / maxDim;
            model.scale.setScalar(scale);
            model.position.set(-3, 0, 4);
            const minY = new THREE.Box3().setFromObject(model).min.y;
            model.position.y += -minY + 0.05;
            model.castShadow = this.settings.shadows;
            model.userData = { onInteract: () => { callback('key'); this.scene.remove(model); } };
            this.scene.add(model);
            this.basementObjects.push(model);
            this.interactiveObjects.push(model);
            const glow = new THREE.PointLight(0xffaa44, 0.2, 3);
            glow.position.set(-3, 0.25, 4);
            this.scene.add(glow);
            this.basementObjects.push(glow);
            console.log('🔑 Ключ добавлен');
        };
        if (this.modelsLoaded.key && this.cachedModels.key) {
            addKey(this.cachedModels.key.clone());
        } else {
            this.createDefaultKey(callback);
            const check = setInterval(() => {
                if (this.modelsLoaded.key && this.cachedModels.key) {
                    clearInterval(check);
                    const old = this.basementObjects.find(obj => obj.userData?.isDefaultKey);
                    if (old) this.scene.remove(old);
                    addKey(this.cachedModels.key.clone());
                }
            }, 100);
        }
    }
    
    createDefaultKey(callback) {
        const group = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18,0.05,16,32), new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.9 }));
        ring.rotation.x = Math.PI/2;
        ring.rotation.z = Math.PI/4;
        group.add(ring);
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.35), new THREE.MeshStandardMaterial({ color: 0xffaa44 }));
        shaft.position.set(0.25,0,0);
        group.add(shaft);
        const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.12,0.08), new THREE.MeshStandardMaterial({ color: 0xffaa44 }));
        tooth1.position.set(0.45,-0.05,0);
        const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.12,0.08), new THREE.MeshStandardMaterial({ color: 0xffaa44 }));
        tooth2.position.set(0.45,0.05,0);
        group.add(tooth1, tooth2);
        group.position.set(-3,0.1,4);
        group.userData = { isDefaultKey: true, onInteract: () => { callback('key'); this.scene.remove(group); } };
        this.scene.add(group);
        this.basementObjects.push(group);
        this.interactiveObjects.push(group);
        const glow = new THREE.PointLight(0xffaa44,0.2,3);
        glow.position.set(-3,0.25,4);
        this.scene.add(glow);
        this.basementObjects.push(glow);
    }
    
    showExitDoor() {
        if(this.exitDoor) this.exitDoor.userData = { onInteract: () => window.gameInstance?.handleInteraction('door') };
        this.interactiveObjects.push(this.exitDoor);
        const glow = new THREE.PointLight(0xffaa44,0.25,4);
        glow.position.copy(this.exitDoor.position);
        this.scene.add(glow);
        this.basementObjects.push(glow);
        const animate = () => {
            requestAnimationFrame(animate);
            if(glow.parent) glow.intensity = 0.15 + Math.sin(Date.now()*0.004)*0.1;
        };
        animate();
    }
    
    clearBasement() {
        this.basementObjects.forEach(obj => { if(obj && obj.parent) this.scene.remove(obj); });
        this.basementObjects = [];
        this.interactiveObjects = [];
        this.exitDoor = null;
        this.collidables = [];
    }
    
    // ========== ОСТРОВ ==========
    createIsland() {
        this.clearBasement();
        this.scene.background = new THREE.Color(0x6a8aad);
        this.scene.fog = new THREE.FogExp2(0x6a8aad, 0.003);
        this.setupSunLighting();
        
        const groundMat = new THREE.MeshStandardMaterial({ map: this.textures.grass, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI/2;
        ground.position.y = -0.5;
        ground.receiveShadow = this.settings.shadows;
        this.scene.add(ground);
        this.objects.push(ground);
        
        const sandMat = new THREE.MeshStandardMaterial({ map: this.textures.sand, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(45,50,32), sandMat);
        sandRing.rotation.x = -Math.PI/2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = this.settings.shadows;
        this.scene.add(sandRing);
        this.objects.push(sandRing);
        
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x5a8a4a });
        for(let i=0;i<40;i++) {
            const angle = Math.random()*Math.PI*2;
            const r = 10+Math.random()*35;
            const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.8,0.4,8), hillMat);
            hill.position.set(Math.cos(angle)*r, -0.35, Math.sin(angle)*r);
            hill.castShadow = this.settings.shadows;
            this.scene.add(hill);
            this.objects.push(hill);
        }
        
        this.createTreesFromCache();
        this.addCampfireFromCache();
        this.addBoatFromCache();
        this.addHouse();
        
        const waterMat = new THREE.MeshStandardMaterial({ color:0x4488cc, metalness:0.8, roughness:0.3, transparent:true, opacity:0.85 });
        this.waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(300,300), waterMat);
        this.waterPlane.rotation.x = -Math.PI/2;
        this.waterPlane.position.y = -0.6;
        this.waterPlane.receiveShadow = false;
        this.scene.add(this.waterPlane);
        this.objects.push(this.waterPlane);
        
        const boundarySize = 48;
        const boundMat = new THREE.MeshBasicMaterial({ visible: false });
        const addBoundary = (pos) => {
            const b = new THREE.Mesh(new THREE.BoxGeometry(boundarySize*2,5,1), boundMat);
            b.position.set(pos[0],2,pos[1]);
            this.scene.add(b);
            this.boundaryWalls.push(b);
            this.objects.push(b);
        };
        addBoundary([0, boundarySize]);
        addBoundary([0, -boundarySize]);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(1,5,boundarySize*2), boundMat);
        b2.position.set(boundarySize,2,0);
        this.scene.add(b2);
        this.boundaryWalls.push(b2);
        this.objects.push(b2);
        const b3 = new THREE.Mesh(new THREE.BoxGeometry(1,5,boundarySize*2), boundMat);
        b3.position.set(-boundarySize,2,0);
        this.scene.add(b3);
        this.boundaryWalls.push(b3);
        this.objects.push(b3);
        
        this.addRocks();
        this.addFlowers();
        
        const spawnMarker = new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.5,0.2,8), new THREE.MeshStandardMaterial({ color:0xcc5500, emissive:0x331100 }));
        spawnMarker.position.set(35, -0.4, 30);
        spawnMarker.castShadow = this.settings.shadows;
        this.scene.add(spawnMarker);
        this.objects.push(spawnMarker);
        
        const markerLight = new THREE.PointLight(0xff6600,0.35,15);
        markerLight.position.set(35,1,30);
        this.scene.add(markerLight);
        this.objects.push(markerLight);
        
        console.log('🌴 Остров создан');
    }
    
    addHouse() {
        const addHouseModel = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const targetSize = 10.0;   // размер
            const scale = targetSize / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.set(0, 2.0, 0); // высота
            model.castShadow = true;
            model.receiveShadow = true;
            this.scene.add(model);
            this.objects.push(model);
            
            // Хитбокс для дома
            const finalBox = new THREE.Box3().setFromObject(model);
            const min = finalBox.min;
            const max = finalBox.max;
            const center = finalBox.getCenter(new THREE.Vector3());
            const halfSize = new THREE.Vector3(
                (max.x - min.x) / 2,
                (max.y - min.y) / 2,
                (max.z - min.z) / 2
            );
            this.collidables.push({
                type: 'box',
                x: center.x,
                y: center.y,
                z: center.z,
                halfSize: halfSize
            });
            console.log('🏠 Дом добавлен с хитбоксом');
        };
        
        if (this.modelsLoaded.house && this.cachedModels.house) {
            addHouseModel(this.cachedModels.house.clone());
        } else {
            console.warn('⚠️ Модель дома ещё не загружена, использую простую коробку с хитбоксом');
            const fallback = new THREE.Mesh(new THREE.BoxGeometry(6,5,6), new THREE.MeshStandardMaterial({ color: 0xaa8866 }));
            fallback.position.set(0, 0.5, 0);
            fallback.castShadow = true;
            this.scene.add(fallback);
            this.objects.push(fallback);
            this.collidables.push({
                type: 'box',
                x: 0,
                y: 0.5 + 2.5,
                z: 0,
                halfSize: new THREE.Vector3(3, 2.5, 3)
            });
            const check = setInterval(() => {
                if (this.modelsLoaded.house && this.cachedModels.house) {
                    clearInterval(check);
                    this.scene.remove(fallback);
                    this.collidables = this.collidables.filter(c => !(c.x === 0 && c.z === 0 && c.halfSize.x === 3));
                    addHouseModel(this.cachedModels.house.clone());
                }
            }, 100);
        }
    }
    
    setupSunLighting() {
        if (this.sunLight) this.scene.remove(this.sunLight);
        if (this.ambientLight) this.scene.remove(this.ambientLight);
        const b = this.settings.brightness || 0.55;
        this.ambientLight = new THREE.AmbientLight(0x88aacc, b * 0.5);
        this.scene.add(this.ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xffdd99, b);
        this.sunLight.position.set(30,30,20);
        this.sunLight.castShadow = this.settings.shadows;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.left = -25;
        this.sunLight.shadow.camera.right = 25;
        this.sunLight.shadow.camera.top = 25;
        this.sunLight.shadow.camera.bottom = -25;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 80;
        this.scene.add(this.sunLight);
        console.log('☀️ Освещение настроено');
    }
    
    createTreesFromCache() {
        const positions = [];
        for(let i=0;i<40;i++) {
            const angle = Math.random()*Math.PI*2;
            const r = 10+Math.random()*38;
            positions.push({ x: Math.cos(angle)*r, z: Math.sin(angle)*r, scale: 0.7+Math.random()*0.6 });
        }
        const add = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const baseScale = 3.2 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            positions.forEach(p => {
                const tree = model.clone();
                const s = baseScale * p.scale;
                tree.scale.setScalar(s);
                tree.position.set(p.x, -0.5, p.z);
                tree.castShadow = this.settings.shadows;
                tree.visible = false;
                this.scene.add(tree);
                this.objects.push(tree);
                this.treeInstances.push(tree);
            });
            console.log(`🌴 ${positions.length} пальм создано`);
            this.updateVisibility();
        };
        if (this.modelsLoaded.palm && this.cachedModels.palm) add(this.cachedModels.palm.clone());
        else this.createDefaultTrees();
    }
    
    createDefaultTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a });
        const positions = [];
        for(let i=0;i<40;i++) {
            const angle = Math.random()*Math.PI*2;
            const r = 10+Math.random()*38;
            positions.push([Math.cos(angle)*r, -0.5, Math.sin(angle)*r]);
        }
        positions.forEach(pos => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.9,1.6,6), trunkMat);
            trunk.position.set(pos[0], pos[1]+0.8, pos[2]);
            trunk.castShadow = this.settings.shadows;
            const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.9,1.2,8), foliageMat);
            f1.position.set(pos[0], pos[1]+1.7, pos[2]);
            const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.7,1.0,8), foliageMat);
            f2.position.set(pos[0], pos[1]+2.5, pos[2]);
            const group = new THREE.Group();
            group.add(trunk, f1, f2);
            group.position.set(pos[0],0,pos[2]);
            group.visible = false;
            this.scene.add(group);
            this.objects.push(group);
            this.treeInstances.push(group);
        });
        console.log(`🌲 ${positions.length} стандартных деревьев`);
        this.updateVisibility();
    }
    
    addCampfireFromCache() {
        const add = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const scale = 0.7 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            model.scale.setScalar(scale);
            model.position.set(0, -0.2, 0);
            model.castShadow = this.settings.shadows;
            this.scene.add(model);
            this.objects.push(model);
            const fireLight = new THREE.PointLight(0xff6600,0.45,12);
            fireLight.position.set(0,0.4,0);
            this.scene.add(fireLight);
            this.objects.push(fireLight);
            const animate = () => {
                requestAnimationFrame(animate);
                if(fireLight.parent) fireLight.intensity = 0.35 + Math.sin(Date.now()*0.01)*0.2;
            };
            animate();
        };
        if (this.modelsLoaded.campfire && this.cachedModels.campfire) add(this.cachedModels.campfire.clone());
        else this.addCampfireStandard();
    }
    
    addCampfireStandard() {
        const logMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a });
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive:0xff3300 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x887a6a });
        for(let i=0;i<8;i++) {
            const angle = (i/8)*Math.PI*2;
            const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), stoneMat);
            stone.position.set(Math.cos(angle)*0.8, -0.3, Math.sin(angle)*0.8);
            stone.scale.setScalar(0.8);
            stone.castShadow = this.settings.shadows;
            this.scene.add(stone);
            this.objects.push(stone);
        }
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.8,6), logMat);
        log1.rotation.z = Math.PI/2;
        log1.position.set(-0.4,-0.2,0.3);
        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.8,6), logMat);
        log2.rotation.x = Math.PI/2;
        log2.position.set(0.3,-0.2,-0.4);
        const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.35,0.2,8), fireMat);
        fire.position.set(0,-0.1,0);
        this.scene.add(log1,log2,fire);
        this.objects.push(log1,log2,fire);
        const light = new THREE.PointLight(0xff4400,0.45,12);
        light.position.set(0,0.4,0);
        this.scene.add(light);
        this.objects.push(light);
        const animate = () => {
            requestAnimationFrame(animate);
            if(fire.parent) light.intensity = 0.35 + Math.sin(Date.now()*0.01)*0.2;
        };
        animate();
    }
    
    addBoatFromCache() {
        const add = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const scale = 1.8 / Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            model.scale.setScalar(scale);
            model.position.set(42, -0.15, 38);
            model.castShadow = this.settings.shadows;
            model.userData = { isBoat: true, onInteract: () => window.gameInstance?.handleInteraction('boat') };
            this.scene.add(model);
            this.objects.push(model);
            this.interactiveObjects.push(model);
            const glow = new THREE.PointLight(0x44aaff,0.25,10);
            glow.position.set(42,0.5,38);
            this.scene.add(glow);
            this.objects.push(glow);
        };
        if (this.modelsLoaded.boat && this.cachedModels.boat) add(this.cachedModels.boat.clone());
        else this.addBoatStandard();
    }
    
    addBoatStandard() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(3,0.6,5), new THREE.MeshStandardMaterial({ color: 0x7a5a4a }));
        body.castShadow = this.settings.shadows;
        group.add(body);
        const front = new THREE.Mesh(new THREE.ConeGeometry(1,1.2,4), new THREE.MeshStandardMaterial({ color: 0x7a5a4a }));
        front.rotation.x = Math.PI/2;
        front.position.set(0,0.3,2.2);
        group.add(front);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.22,2.5,6), new THREE.MeshStandardMaterial({ color: 0x5a3a2a }));
        mast.position.set(0,1.5,0);
        group.add(mast);
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.5,2), new THREE.MeshStandardMaterial({ color: 0xeeddcc }));
        sail.position.set(0,1.8,0.15);
        group.add(sail);
        group.position.set(42,0,38);
        group.userData = { isBoat: true, onInteract: () => window.gameInstance?.handleInteraction('boat') };
        this.scene.add(group);
        this.objects.push(group);
        this.interactiveObjects.push(group);
    }
    
    addRocks() {
        const mat = new THREE.MeshStandardMaterial({ color: 0x6a6a5a });
        for(let i=0;i<60;i++) {
            const angle = Math.random()*Math.PI*2;
            const r = 12+Math.random()*42;
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), mat);
            rock.position.set(Math.cos(angle)*r, -0.45, Math.sin(angle)*r);
            rock.scale.setScalar(0.5+Math.random()*0.8);
            rock.castShadow = this.settings.shadows;
            this.scene.add(rock);
            this.objects.push(rock);
        }
    }
    
    addFlowers() {
        const colors = [0xffaa66,0xff66aa,0xaa66ff,0xff6666];
        for(let i=0;i<200;i++) {
            const angle = Math.random()*Math.PI*2;
            const r = 5+Math.random()*48;
            const flower = new THREE.Mesh(new THREE.ConeGeometry(0.07,0.12,6), new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            flower.position.set(Math.cos(angle)*r, -0.48, Math.sin(angle)*r);
            flower.castShadow = this.settings.shadows;
            this.scene.add(flower);
            this.objects.push(flower);
        }
    }
    
    spawnCanister(callback) {
        const spawn = (model) => {
            const box = new THREE.Box3().setFromObject(model);
            const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
            const scale = 0.6 / maxDim;
            model.scale.setScalar(scale);
            let x,z;
            do {
                const angle = Math.random()*Math.PI*2;
                const r = 15+Math.random()*25;
                x = Math.cos(angle)*r;
                z = Math.sin(angle)*r;
            } while(Math.hypot(x-42, z-38) < 8);
            model.position.set(x, -0.2, z);
            model.castShadow = this.settings.shadows;
            model.userData = { onInteract: () => { callback(); this.scene.remove(model); if(glow) this.scene.remove(glow); } };
            this.scene.add(model);
            this.objects.push(model);
            this.interactiveObjects.push(model);
            const glow = new THREE.PointLight(0xffaa66,0.4,5);
            glow.position.copy(model.position);
            this.scene.add(glow);
            this.objects.push(glow);
        };
        if (this.modelsLoaded.canister && this.cachedModels.canister) spawn(this.cachedModels.canister.clone());
        else {
            const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.6,0.3), new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness:0.6 }));
            spawn(dummy);
        }
    }
    
    clearScene() {
        this.objects.forEach(obj => { if(obj && obj.parent) this.scene.remove(obj); });
        this.objects = [];
        this.interactiveObjects = [];
        this.boundaryWalls = [];
        this.waterPlane = null;
        this.treeInstances = [];
    }
}
