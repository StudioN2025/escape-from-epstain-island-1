import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.interactiveObjects = [];
        this.objects = [];
        this.exitDoor = null;
        this.waterPlane = null;
        this.boundaryWalls = [];
        this.basementObjects = []; // Массив для хранения объектов подвала
    }
    
    async createBasement() {
        // Очищаем предыдущие объекты подвала
        this.clearBasement();
        
        // Floor with texture-like appearance
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.basementObjects.push(floor);
        
        // Grid helper for floor (better visual)
        const gridHelper = new THREE.GridHelper(20, 20, 0x886644, 0x664422);
        gridHelper.position.y = -0.4;
        this.scene.add(gridHelper);
        this.basementObjects.push(gridHelper);
        
        // Walls
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
        
        // Ceiling with wooden beams
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        this.basementObjects.push(ceiling);
        
        // Wooden beams on ceiling
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        for (let x = -7; x <= 7; x += 3.5) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 18), beamMat);
            beam.position.set(x, 2.7, 0);
            this.scene.add(beam);
            this.basementObjects.push(beam);
        }
        
        // Add some pillars
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
        
        // Create exit door (locked)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        this.exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), doorMat);
        this.exitDoor.position.set(8, 0, -9.4);
        this.exitDoor.castShadow = true;
        this.scene.add(this.exitDoor);
        this.basementObjects.push(this.exitDoor);
        
        // Door frame
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
        
        // Decorative elements
        this.addBarrels();
        this.addTorches();
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
    
    addTorches() {
        const torchMat = new THREE.MeshStandardMaterial({ color: 0xaa6633 });
        const lightColor = 0xff6633;
        
        const torchPositions = [[-7, 1, -6], [7, 1, -6], [-7, 1, 6], [7, 1, 6]];
        torchPositions.forEach(pos => {
            const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), torchMat);
            torch.position.set(pos[0], pos[1], pos[2]);
            torch.castShadow = true;
            this.scene.add(torch);
            this.basementObjects.push(torch);
            
            // Torch flame
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
        // Beautiful key on a pedestal
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4 });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8), pedestalMat);
        pedestal.position.set(-3, -0.3, 4);
        pedestal.castShadow = true;
        this.scene.add(pedestal);
        this.basementObjects.push(pedestal);
        
        // Key group
        const keyGroup = new THREE.Group();
        
        // Key handle (ring)
        const ringGeo = new THREE.TorusGeometry(0.18, 0.05, 16, 32);
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.9, roughness: 0.2, emissive: 0x442200 });
        const ring = new THREE.Mesh(ringGeo, keyMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = Math.PI / 4;
        keyGroup.add(ring);
        
        // Key shaft
        const shaftGeo = new THREE.BoxGeometry(0.08, 0.08, 0.35);
        const shaft = new THREE.Mesh(shaftGeo, keyMat);
        shaft.position.set(0.25, 0, 0);
        keyGroup.add(shaft);
        
        // Key teeth
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
        
        // Add glowing effect around key
        const glowLight = new THREE.PointLight(0xffaa44, 0.5, 3);
        glowLight.position.set(-3, 0.2, 4);
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        // Animate key floating and rotating
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
        // Make door glow and interactive
        this.exitDoor.userData = {
            onInteract: () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('door');
                }
            }
        };
        this.interactiveObjects.push(this.exitDoor);
        
        // Add glow effect
        const glowLight = new THREE.PointLight(0xffaa44, 0.8, 5);
        glowLight.position.copy(this.exitDoor.position);
        this.scene.add(glowLight);
        this.basementObjects.push(glowLight);
        
        // Animate glow
        const animateGlow = () => {
            requestAnimationFrame(animateGlow);
            if (glowLight.parent) {
                glowLight.intensity = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
            }
        };
        animateGlow();
    }
    
    clearBasement() {
        // Удаляем все объекты подвала из сцены
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
        // Полностью очищаем подвал перед созданием острова
        this.clearBasement();
        
        // Sky background
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.003);
        
        // Large island ground
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
        
        // Sand around the edges
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xddbb77, roughness: 0.8 });
        const sandRing = new THREE.Mesh(new THREE.RingGeometry(45, 50, 32), sandMat);
        sandRing.rotation.x = -Math.PI / 2;
        sandRing.position.y = -0.45;
        sandRing.receiveShadow = true;
        this.scene.add(sandRing);
        this.objects.push(sandRing);
        
        // Add varied terrain (small hills)
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2a });
        for (let i = 0; i < 60; i++) {
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
        
        // Add many trees
        this.addTrees();
        
        // Boat (escape object) - placed at the beach
        const boatGroup = new THREE.Group();
        const boatMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        const boatBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 4), boatMat);
        boatBody.castShadow = true;
        boatGroup.add(boatBody);
        
        // Boat front
        const boatFront = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 4), boatMat);
        boatFront.rotation.x = Math.PI / 2;
        boatFront.position.set(0, 0.2, 1.8);
        boatFront.castShadow = true;
        boatGroup.add(boatFront);
        
        // Mast
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2, 6), mastMat);
        mast.position.set(0, 1.2, 0);
        boatGroup.add(mast);
        
        // Sail
        const sailMat = new THREE.MeshStandardMaterial({ color: 0xeeddcc });
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), sailMat);
        sail.position.set(0, 1.5, 0.1);
        sail.castShadow = true;
        boatGroup.add(sail);
        
        boatGroup.position.set(42, 0, 38);
        boatGroup.castShadow = true;
        this.scene.add(boatGroup);
        this.objects.push(boatGroup);
        
        boatGroup.userData = {
            onInteract: () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('boat');
                }
            }
        };
        this.interactiveObjects.push(boatGroup);
        
        // Water around island
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
        
        // Create invisible boundary walls to prevent falling off
        const boundarySize = 48;
        const boundaryHeight = 5;
        const boundaryMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
        
        // North boundary
        const northBoundary = new THREE.Mesh(new THREE.BoxGeometry(boundarySize * 2, boundaryHeight, 1), boundaryMat);
        northBoundary.position.set(0, 2, boundarySize);
        this.scene.add(northBoundary);
        this.boundaryWalls.push(northBoundary);
        this.objects.push(northBoundary);
        
        // South boundary
        const southBoundary = new THREE.Mesh(new THREE.BoxGeometry(boundarySize * 2, boundaryHeight, 1), boundaryMat);
        southBoundary.position.set(0, 2, -boundarySize);
        this.scene.add(southBoundary);
        this.boundaryWalls.push(southBoundary);
        this.objects.push(southBoundary);
        
        // East boundary
        const eastBoundary = new THREE.Mesh(new THREE.BoxGeometry(1, boundaryHeight, boundarySize * 2), boundaryMat);
        eastBoundary.position.set(boundarySize, 2, 0);
        this.scene.add(eastBoundary);
        this.boundaryWalls.push(eastBoundary);
        this.objects.push(eastBoundary);
        
        // West boundary
        const westBoundary = new THREE.Mesh(new THREE.BoxGeometry(1, boundaryHeight, boundarySize * 2), boundaryMat);
        westBoundary.position.set(-boundarySize, 2, 0);
        this.scene.add(westBoundary);
        this.boundaryWalls.push(westBoundary);
        this.objects.push(westBoundary);
        
        // Add campfire in center
        this.addCampfire();
        
        // Add rocks and details
        this.addRocks();
        
        // Add some flowers
        this.addFlowers();
        
        // Add a small dock near the boat
        this.addDock();
    }
    
    addDock() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        const dock = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 4), woodMat);
        dock.position.set(40, -0.3, 36);
        dock.castShadow = true;
        this.scene.add(dock);
        this.objects.push(dock);
        
        // Dock posts
        const postMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const postPositions = [[38.5, -0.2, 34.5], [41.5, -0.2, 34.5], [38.5, -0.2, 37.5], [41.5, -0.2, 37.5]];
        postPositions.forEach(pos => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 6), postMat);
            post.position.set(pos[0], pos[1], pos[2]);
            post.castShadow = true;
            this.scene.add(post);
            this.objects.push(post);
        });
    }
    
    addTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        
        // Many trees spread across the island
        const treePositions = [];
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 8 + Math.random() * 38;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            treePositions.push([x, -0.5, z]);
        }
        
        treePositions.forEach(pos => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.3, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.6, pos[2]);
            trunk.castShadow = true;
            
            const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1, 8), foliageMat);
            foliage1.position.set(pos[0], pos[1] + 1.3, pos[2]);
            foliage1.castShadow = true;
            
            const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), foliageMat);
            foliage2.position.set(pos[0], pos[1] + 2, pos[2]);
            foliage2.castShadow = true;
            
            this.scene.add(trunk);
            this.scene.add(foliage1);
            this.scene.add(foliage2);
            this.objects.push(trunk, foliage1, foliage2);
        });
    }
    
    addCampfire() {
        const logMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a });
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
        
        // Stone circle
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x887a6a });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), stoneMat);
            stone.position.set(Math.cos(angle) * 0.8, -0.3, Math.sin(angle) * 0.8);
            stone.scale.setScalar(0.8);
            this.scene.add(stone);
            this.objects.push(stone);
        }
        
        // Logs
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
        
        // Animate fire
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
    
    addRocks() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a });
        for (let i = 0; i < 80; i++) {
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
        for (let i = 0; i < 300; i++) {
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
        // Удаляем все объекты острова
        this.objects.forEach(obj => {
            if (obj && obj.parent) {
                this.scene.remove(obj);
            }
        });
        this.objects = [];
        this.interactiveObjects = [];
        this.boundaryWalls = [];
        this.waterPlane = null;
    }
}
