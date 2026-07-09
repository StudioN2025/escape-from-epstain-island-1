import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class FBXLoaderHelper {
    constructor(scene) {
        this.scene = scene;
        this.loader = new FBXLoader();
        this.models = new Map();
    }
    
    // Загрузка модели с анимациями
    async loadModel(name, url, options = {}) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (fbx) => {
                const model = {
                    mesh: fbx,
                    mixer: null,
                    animations: new Map(),
                    currentAction: null,
                    options: options
                };
                
                // Настройка масштаба
                if (options.scale) {
                    fbx.scale.setScalar(options.scale);
                }
                
                // Настройка позиции
                if (options.position) {
                    fbx.position.copy(options.position);
                }
                
                // Настройка теней
                fbx.castShadow = options.castShadow !== false;
                fbx.receiveShadow = options.receiveShadow || false;
                
                // Настройка анимаций
                if (fbx.animations && fbx.animations.length > 0) {
                    model.mixer = new THREE.AnimationMixer(fbx);
                    
                    fbx.animations.forEach((clip, index) => {
                        const action = model.mixer.clipAction(clip);
                        const animName = options.animationNames && options.animationNames[index] 
                            ? options.animationNames[index] 
                            : `anim_${index}`;
                        model.animations.set(animName, action);
                        
                        console.log(`Загружена анимация "${animName}" для модели "${name}"`);
                    });
                }
                
                this.scene.add(fbx);
                this.models.set(name, model);
                resolve(model);
            }, undefined, (error) => {
                console.error(`Ошибка загрузки модели "${name}":`, error);
                reject(error);
            });
        });
    }
    
    // Воспроизведение анимации
    playAnimation(modelName, animationName, loop = true, fadeTime = 0.3) {
        const model = this.models.get(modelName);
        if (!model) {
            console.warn(`Модель "${modelName}" не найдена`);
            return;
        }
        
        const action = model.animations.get(animationName);
        if (!action) {
            console.warn(`Анимация "${animationName}" не найдена для модели "${modelName}"`);
            return;
        }
        
        if (model.currentAction) {
            model.currentAction.fadeOut(fadeTime);
        }
        
        model.currentAction = action;
        action.reset();
        action.fadeIn(fadeTime);
        action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = !loop;
        action.play();
    }
    
    // Обновление анимаций (вызывать в игровом цикле)
    update(deltaTime) {
        this.models.forEach(model => {
            if (model.mixer) {
                model.mixer.update(deltaTime);
            }
        });
    }
    
    // Получение модели
    getModel(name) {
        const model = this.models.get(name);
        return model ? model.mesh : null;
    }
    
    // Установка позиции модели
    setPosition(name, position) {
        const model = this.models.get(name);
        if (model && model.mesh) {
            model.mesh.position.copy(position);
        }
    }
    
    // Установка ротации модели
    setRotation(name, rotation) {
        const model = this.models.get(name);
        if (model && model.mesh) {
            model.mesh.rotation.copy(rotation);
        }
    }
}
