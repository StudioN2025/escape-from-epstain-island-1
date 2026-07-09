// AssetManager.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export class AssetManager {
    constructor() {
        this.textures = new Map();
        this.models = new Map();
        this.sounds = new Map();
        this.loadingProgress = 0;
        this.loadingTotal = 0;
    }

    async loadAll(resourcesList, onProgress) {
        this.loadingTotal = resourcesList.length;
        let loaded = 0;

        const updateProgress = (name, type) => {
            loaded++;
            const percent = Math.floor((loaded / this.loadingTotal) * 100);
            if (onProgress) onProgress(percent, `${type}: ${name}`);
        };

        const textureLoader = new THREE.TextureLoader();
        const gltfLoader = new GLTFLoader();
        const fbxLoader = new FBXLoader();

        const promises = resourcesList.map(async (res) => {
            if (res.type === 'texture') {
                return new Promise((resolve) => {
                    textureLoader.load(res.path, (tex) => {
                        this.textures.set(res.name, tex);
                        updateProgress(res.name, 'Текстура');
                        resolve();
                    }, undefined, () => {
                        console.warn(`Текстура ${res.name} не загружена`);
                        updateProgress(res.name, 'Ошибка текстуры');
                        resolve();
                    });
                });
            } else if (res.type === 'model') {
                const loader = res.path.endsWith('.fbx') ? fbxLoader : gltfLoader;
                return new Promise((resolve) => {
                    loader.load(res.path, (model) => {
                        // Для GLTF нужно взять .scene, для FBX - сам объект
                        let modelObj;
                        if (model.scene) {
                            // Это GLTF
                            modelObj = model.scene;
                        } else {
                            // Это FBX
                            modelObj = model;
                        }
                        // Сохраняем оригинал
                        this.models.set(res.name, modelObj);
                        updateProgress(res.name, 'Модель');
                        resolve();
                    }, undefined, (err) => {
                        console.warn(`Модель ${res.name} не загружена:`, err);
                        updateProgress(res.name, 'Ошибка модели');
                        resolve();
                    });
                });
            } else if (res.type === 'sound') {
                return new Promise((resolve) => {
                    const audio = new Audio(res.path);
                    audio.addEventListener('canplaythrough', () => {
                        this.sounds.set(res.name, audio);
                        updateProgress(res.name, 'Звук');
                        resolve();
                    });
                    audio.addEventListener('error', () => {
                        console.warn(`Звук ${res.name} не загружен`);
                        updateProgress(res.name, 'Ошибка звука');
                        resolve();
                    });
                    audio.load();
                });
            }
        });

        await Promise.all(promises);
        console.log('✅ Все ресурсы загружены');
    }

    getTexture(name) {
        return this.textures.get(name);
    }

    getModel(name) {
        const model = this.models.get(name);
        if (!model) return null;
        // Возвращаем КЛОН модели, чтобы каждый раз был новый объект
        // Это критически важно, т.к. одна и та же модель может использоваться в нескольких местах
        return model.clone();
    }

    getSound(name) {
        const sound = this.sounds.get(name);
        if (!sound) return null;
        // Для звуков возвращаем новый Audio с тем же src,
        // чтобы можно было играть несколько звуков одновременно
        const newAudio = new Audio(sound.src);
        newAudio.load();
        return newAudio;
    }
}
