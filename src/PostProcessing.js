import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        
        this.init();
    }
    
    init() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Приглушенное свечение
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.35,   // strength
            0.3,    // radius
            0.15    // threshold
        );
        this.bloomPass.renderToScreen = true;
        this.composer.addPass(this.bloomPass);
        
        console.log('✨ Постобработка настроена');
    }
    
    setBloomStrength(strength) {
        if (this.bloomPass) {
            this.bloomPass.strength = strength;
        }
    }
    
    resize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
    
    render() {
        if (this.composer) {
            this.composer.render();
        }
    }
}
