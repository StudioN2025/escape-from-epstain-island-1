import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.interactiveObjects = [];
        this.objects = [];
        this.exitDoor = null;
    }
    
    async createBasement() {
        // Floor with texture-like appearance
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Grid helper for floor (better visual)
        const gridHelper = new THREE.GridHelper(20, 20, 0x886644, 0x664422);
        gridHelper.position.y = -0.4;
        this.scene.add(gridHelper);
        
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
        });
        
        // Ceiling with wooden beams
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        
        // Wooden beams on ceiling
        const beamMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        for (let x = -7; x <= 7; x += 3.5) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 18), beamMat);
            beam.position.set(x, 2.7, 0);
            this.scene.add(beam);
        }
        
        // Add some pillars
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
        for (let x = -6; x <= 6; x += 6) {
            for (let z = -6; z <= 6; z += 6) {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), pillarMat);
                pillar.position.set(x, 0, z);
                pillar.castShadow = true;
                this.scene.add(pillar);
            }
        }
        
        // Create exit door (locked)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        this.exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), doorMat);
        this.exitDoor.position.set(8, 0, -9.4);
        this.exitDoor.castShadow = true;
        this.scene.add(this.exitDoor);
        
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
            
            // Torch flame
            const flameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 6), flameMat);
            flame.position.set(pos[0], pos[1] + 0.7, pos[2]);
            this.scene.add(flame);
            
            const light = new THREE.PointLight(lightColor, 0.5, 8);
            light.position.set(pos[0], pos[1] + 0.5, pos[2]);
            this.scene.add(light);
        });
    }
    
    createInteractiveObjects(interactCallback) {
        // Beautiful key on a pedestal
        const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.4 });
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8), pedestalMat);
        pedestal.position.set(-3, -0.3, 4);
        pedestal.castShadow = true;
        this.scene.add(pedestal);
        
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
        
        keyGroup.userData = {
            onInteract: () => interactCallback('key')
        };
        this.interactiveObjects.push(keyGroup);
        
        // Add glowing effect around key
        const glowLight = new THREE.PointLight(0xffaa44, 0.5, 3);
        glowLight.position.set(-3, 0.2, 4);
        this.scene.add(glowLight);
        
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
        
        // Animate glow
        const animateGlow = () => {
            requestAnimationFrame(animateGlow);
            if (glowLight.parent) {
                glowLight.intensity = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
            }
        };
        animateGlow();
    }
    
    createIsland() {
        // Clear basement objects
        this.clearScene();
        
        // Sky background
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.005);
        
        // Large island ground (much bigger)
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add varied terrain (small hills)
        const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2a });
        for (let i = 0; i < 50; i++) {
            const hill = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 0.5, 8), hillMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 35;
            hill.position.x = Math.cos(angle) * radius;
            hill.position.z = Math.sin(angle) * radius;
            hill.position.y = -0.3;
            hill.castShadow = true;
            this.scene.add(hill);
        }
        
        // Add many trees
        this.addTrees();
        
        // Boat (escape object) - placed far away
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
        
        boatGroup.position.set(45, 0, 40);
        boatGroup.castShadow = true;
        this.scene.add(boatGroup);
        
        boatGroup.userData = {
            onInteract: () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('boat');
                }
            }
        };
        this.interactiveObjects.push(boatGroup);
        
        // Add particle effect around boat
        const boatGlow = new THREE.PointLight(0x44aaff, 0.5, 15);
        boatGlow.position.set(45, 1, 40);
        this.scene.add(boatGlow);
        
        // Water around island
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x3366aa, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.85 });
        const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.8;
        water.receiveShadow = true;
        this.scene.add(water);
        
        // Add campfire in center
        this.addCampfire();
        
        // Add rocks and details
        this.addRocks();
        
        // Add some flowers
        this.addFlowers();
    }
    
    addTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        
        // Many trees spread across the island
        const treePositions = [];
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 40;
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
        }
        
        // Logs
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-0.4, -0.2, 0.3);
        this.scene.add(log1);
        
        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), logMat);
        log2.rotation.x = Math.PI / 2;
        log2.position.set(0.3, -0.2, -0.4);
        this.scene.add(log2);
        
        const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.2, 8), fireMat);
        fire.position.set(0, -0.1, 0);
        fire.castShadow = true;
        this.scene.add(fire);
        
        const light = new THREE.PointLight(0xff4400, 0.8, 15);
        light.position.set(0, 0.5, 0);
        this.scene.add(light);
        
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
        for (let i = 0; i < 60; i++) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), rockMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 45;
            rock.position.x = Math.cos(angle) * radius;
            rock.position.z = Math.sin(angle) * radius;
            rock.position.y = -0.4;
            rock.scale.setScalar(0.5 + Math.random() * 0.8);
            rock.castShadow = true;
            this.scene.add(rock);
        }
    }
    
    addFlowers() {
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffaa66 });
        for (let i = 0; i < 200; i++) {
            const flower = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 6), flowerMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 50;
            flower.position.x = Math.cos(angle) * radius;
            flower.position.z = Math.sin(angle) * radius;
            flower.position.y = -0.45;
            flower.castShadow = true;
            this.scene.add(flower);
        }
    }
    
    clearScene() {
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];
        this.interactiveObjects = [];
    }
}
