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
        this.effectActive = true;
        
        this.init();
    }
    
    init() {
        // Создаём EffectComposer
        this.composer = new EffectComposer(this.renderer);
        
        // RenderPass - основной проход рендера
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom/Glow эффект (красивое свечение)
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,   // strength - сила свечения
            0.4,   // radius - радиус свечения
            0.2    // threshold - порог (что будет светиться)
        );
        this.bloomPass.renderToScreen = true;
        this.composer.addPass(this.bloomPass);
        
        console.log('✨ Постобработка инициализирована (только свечение)');
    }
    
    // Изменение силы свечения
    setBloomStrength(strength) {
        if (this.bloomPass) {
            this.bloomPass.strength = strength;
        }
    }
    
    // Изменение радиуса свечения
    setBloomRadius(radius) {
        if (this.bloomPass) {
            this.bloomPass.radius = radius;
        }
    }
    
    // Изменение порога свечения
    setBloomThreshold(threshold) {
        if (this.bloomPass) {
            this.bloomPass.threshold = threshold;
        }
    }
    
    // Включение/выключение эффектов
    toggleEffects() {
        this.effectActive = !this.effectActive;
        if (this.effectActive) {
            this.bloomPass.strength = 0.5;
        } else {
            this.bloomPass.strength = 0;
        }
    }
    
    // Обновление размера при изменении окна
    resize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
    
    // Рендер с постобработкой
    render() {
        if (this.composer) {
            this.composer.render();
        }
    }
}
