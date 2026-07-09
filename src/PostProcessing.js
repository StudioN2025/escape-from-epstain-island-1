import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class PostProcessing {
    constructor(renderer, scene, camera, enabled = true) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        this.enabled = enabled;
        
        if (this.enabled) {
            this.init();
        } else {
            console.log('⚡ Постобработка отключена');
        }
    }
    
    init() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.35,
            0.3,
            0.15
        );
        this.bloomPass.renderToScreen = true;
        this.composer.addPass(this.bloomPass);
        
        console.log('✨ Постобработка включена');
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            console.log('⚡ Постобработка выключена');
        } else if (!this.composer) {
            this.init();
        }
    }
    
    setBloomStrength(strength) {
        if (this.bloomPass && this.enabled) {
            this.bloomPass.strength = strength;
        }
    }
    
    resize(width, height) {
        if (this.composer && this.enabled) {
            this.composer.setSize(width, height);
        }
    }
    
    render() {
        if (this.composer && this.enabled) {
            this.composer.render();
        } else if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
