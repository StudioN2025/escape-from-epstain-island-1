import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.bloomPass = null;
        this.filmPass = null;
        this.effectActive = true;
        
        this.init();
    }
    
    init() {
        // Создаём EffectComposer
        this.composer = new EffectComposer(this.renderer);
        
        // RenderPass - основной проход рендера
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom/Glow эффект (свечение)
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6,   // strength - сила свечения
            0.3,   // radius - радиус
            0.1    // threshold - порог
        );
        this.composer.addPass(this.bloomPass);
        
        // Film grain эффект (зернистость как в старом кино)
        this.filmPass = new FilmPass(
            0.25,   // noise intensity - интенсивность шума
            0.5,    // scanline intensity - интенсивность строк
            648,    // scanline count - количество строк
            false   // grayscale - ч/б
        );
        this.filmPass.renderToScreen = true;
        this.composer.addPass(this.filmPass);
        
        console.log('🎬 Постобработка инициализирована');
    }
    
    // Изменение силы свечения
    setBloomStrength(strength) {
        if (this.bloomPass) {
            this.bloomPass.strength = strength;
        }
    }
    
    // Изменение порога свечения
    setBloomThreshold(threshold) {
        if (this.bloomPass) {
            this.bloomPass.threshold = threshold;
        }
    }
    
    // Изменение интенсивности шума
    setNoiseIntensity(intensity) {
        if (this.filmPass) {
            this.filmPass.uniforms['intensity'].value = intensity;
        }
    }
    
    // Включение/выключение эффектов
    toggleEffects() {
        this.effectActive = !this.effectActive;
        if (this.effectActive) {
            this.bloomPass.strength = 0.6;
            this.filmPass.uniforms['intensity'].value = 0.25;
        } else {
            this.bloomPass.strength = 0;
            this.filmPass.uniforms['intensity'].value = 0;
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
