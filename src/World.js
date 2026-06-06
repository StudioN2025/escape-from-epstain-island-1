import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.interactiveObjects = [];
        this.objects = [];
        this.exitDoor = null;
    }
    
    async createBasement() {
        // Floor
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.6 });
        const walls = [
            { pos: [0, 1.5, -8.5], scale: [18, 3, 0.5] },
            { pos: [0, 1.5, 8.5], scale: [18, 3, 0.5] },
            { pos: [-8.5, 1.5, 0], scale: [0.5, 3, 18] },
            { pos: [8.5, 1.5, 0], scale: [0.5, 3, 18] }
        ];
        
        walls.forEach(wall => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wall.scale), wallMat);
            mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
        
        // Ceiling with bars effect
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 18), ceilingMat);
        ceiling.position.set(0, 2.8, 0);
        this.scene.add(ceiling);
        
        // Add some pillars
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
        for (let x = -5; x <= 5; x += 5) {
            for (let z = -5; z <= 5; z += 5) {
                const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 0.6), pillarMat);
                pillar.position.set(x, 0, z);
                pillar.castShadow = true;
                this.scene.add(pillar);
            }
        }
        
        // Create exit door (locked)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        this.exitDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), doorMat);
        this.exitDoor.position.set(7, 0, -8.4);
        this.exitDoor.castShadow = true;
        this.scene.add(this.exitDoor);
        
        // Decorative elements
        this.addBarrels();
        
        // Add some torches for atmosphere
        this.addTorches();
    }
    
    addBarrels() {
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a });
        const positions = [[-3, -0.5, 2], [2, -0.5, -2], [4, -0.5, 3], [-4, -0.5, -3]];
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
        
        const torchPositions = [[-6, 1, -5], [6, 1, -5], [-6, 1, 5], [6, 1, 5]];
        torchPositions.forEach(pos => {
            const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), torchMat);
            torch.position.set(pos[0], pos[1], pos[2]);
            torch.castShadow = true;
            this.scene.add(torch);
            
            const light = new THREE.PointLight(lightColor, 0.5, 8);
            light.position.set(pos[0], pos[1] + 0.5, pos[2]);
            this.scene.add(light);
        });
    }
    
    createInteractiveObjects(interactCallback) {
        // Key object
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.8, emissive: 0x442200 });
        const keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.5), keyMat);
        keyMesh.position.set(-2, 0.5, 3);
        keyMesh.castShadow = true;
        keyMesh.userData = {
            onInteract: () => interactCallback('key')
        };
        this.scene.add(keyMesh);
        this.interactiveObjects.push(keyMesh);
        
        // Add floating effect for key
        const animateKey = () => {
            requestAnimationFrame(animateKey);
            if (keyMesh.parent) {
                keyMesh.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.1;
                keyMesh.rotation.y += 0.02;
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
    }
    
    createIsland() {
        // Clear basement objects (but keep lights)
        this.clearScene();
        
        // Sky background
        this.scene.background = new THREE.Color(0x1a4d8c);
        this.scene.fog = new THREE.FogExp2(0x1a4d8c, 0.008);
        
        // Ground
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grass patches
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x4a7a2a });
        for (let i = 0; i < 300; i++) {
            const grass = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.2, 3), grassMat);
            const x = (Math.random() - 0.5) * 44;
            const z = (Math.random() - 0.5) * 44;
            grass.position.set(x, -0.4, z);
            grass.castShadow = true;
            this.scene.add(grass);
        }
        
        // Trees
        this.addTrees();
        
        // Boat (escape object)
        const boatMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a });
        const boat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 3.5), boatMat);
        boat.position.set(20, 0, 18);
        boat.castShadow = true;
        boat.userData = {
            onInteract: () => {
                if (window.gameInstance && window.gameInstance.handleInteraction) {
                    window.gameInstance.handleInteraction('boat');
                }
            }
        };
        this.scene.add(boat);
        this.interactiveObjects.push(boat);
        
        // Add mast to boat
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6), mastMat);
        mast.position.set(0, 0.8, 0);
        boat.add(mast);
        
        // Water around island
        const waterMat = new THREE.MeshStandardMaterial({ color: 0x3366aa, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.9 });
        const water = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.8;
        water.receiveShadow = true;
        this.scene.add(water);
        
        // Add campfire
        this.addCampfire();
        
        // Add rocks
        this.addRocks();
    }
    
    addTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        
        const treePositions = [[-12, -0.5, -10], [10, -0.5, -12], [-8, -0.5, 12], [15, -0.5, 5], [-15, -0.5, 8], [-5, -0.5, -15], [5, -0.5, -14]];
        
        treePositions.forEach(pos => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.5, 6), trunkMat);
            trunk.position.set(pos[0], pos[1] + 0.7, pos[2]);
            trunk.castShadow = true;
            
            const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 8), foliageMat);
            foliage1.position.set(pos[0], pos[1] + 1.5, pos[2]);
            foliage1.castShadow = true;
            
            const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1, 8), foliageMat);
            foliage2.position.set(pos[0], pos[1] + 2.2, pos[2]);
            foliage2.castShadow = true;
            
            this.scene.add(trunk);
            this.scene.add(foliage1);
            this.scene.add(foliage2);
        });
    }
    
    addCampfire() {
        const logMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a });
        const fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
        
        // Logs
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6), logMat);
        log1.rotation.z = Math.PI / 2;
        log1.position.set(-5.2, 0, 8);
        this.scene.add(log1);
        
        const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6), logMat);
        log2.rotation.x = Math.PI / 2;
        log2.position.set(-4.8, 0, 8);
        this.scene.add(log2);
        
        const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8), fireMat);
        fire.position.set(-5, 0.1, 8);
        fire.castShadow = true;
        this.scene.add(fire);
        
        const light = new THREE.PointLight(0xff4400, 0.8, 12);
        light.position.set(-5, 0.5, 8);
        this.scene.add(light);
        
        // Animate fire
        const animateFire = () => {
            requestAnimationFrame(animateFire);
            if (fire.parent) {
                const intensity = 0.6 + Math.sin(Date.now() * 0.01) * 0.3;
                light.intensity = intensity;
                fire.scale.setScalar(1 + Math.sin(Date.now() * 0.015) * 0.1);
            }
        };
        animateFire();
    }
    
    addRocks() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a6a });
        const rockPositions = [[18, -0.4, 12], [-18, -0.4, -15], [16, -0.4, -10], [-14, -0.4, 16]];
        
        rockPositions.forEach(pos => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), rockMat);
            rock.position.set(pos[0], pos[1], pos[2]);
            rock.scale.setScalar(0.8 + Math.random() * 0.5);
            rock.castShadow = true;
            this.scene.add(rock);
        });
    }
    
    clearScene() {
        this.objects.forEach(obj => this.scene.remove(obj));
        this.objects = [];
        this.interactiveObjects = [];
    }
}
