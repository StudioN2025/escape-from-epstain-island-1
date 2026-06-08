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
        this.enabled = this.checkPerformance(); // Автоматическое отключение на слабых ПК
        
        if (this.enabled) {
            this.init();
        } else {
            console.log('⚡ Постобработка отключена для производительности');
        }
    }
    
    checkPerformance() {
        // Простая проверка производительности
        // На слабых ПК отключаем эффекты
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return !isMobile;
    }
    
    init() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.25, // Уменьшено с 0.35
            0.2,
            0.1
        );
        this.bloomPass.renderToScreen = true;
        this.composer.addPass(this.bloomPass);
        
        console.log('✨ Постобработка настроена (облегчённая)');
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
