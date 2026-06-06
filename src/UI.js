export class UIManager {
    constructor() {
        this.messageArea = document.getElementById('message-area');
        this.messageText = document.getElementById('message-text');
        this.questText = document.getElementById('quest-text');
        this.prompt = document.getElementById('interaction-prompt');
        this.menu = document.getElementById('menu-overlay');
        this.gameOverScreen = document.getElementById('game-over');
        this.winScreen = document.getElementById('win-screen');
        
        // Bind restart buttons
        if (document.getElementById('retry-btn')) {
            document.getElementById('retry-btn').onclick = () => location.reload();
        }
        if (document.getElementById('play-again')) {
            document.getElementById('play-again').onclick = () => location.reload();
        }
    }
    
    showMessage(text, duration = 3000) {
        if (!this.messageArea || !this.messageText) return;
        
        // Remove existing animation
        this.messageArea.style.animation = 'none';
        this.messageArea.offsetHeight; // Trigger reflow
        this.messageArea.style.animation = null;
        
        this.messageText.textContent = text;
        this.messageArea.classList.remove('hidden');
        
        setTimeout(() => {
            if (this.messageArea) {
                this.messageArea.classList.add('hidden');
            }
        }, duration);
    }
    
    updateQuest(text) {
        if (this.questText) {
            this.questText.textContent = text;
        }
    }
    
    showPrompt(text) {
        if (this.prompt) {
            const promptText = document.getElementById('prompt-text');
            if (promptText) promptText.textContent = text;
            this.prompt.classList.remove('hidden');
        }
    }
    
    hidePrompt() {
        if (this.prompt) {
            this.prompt.classList.add('hidden');
        }
    }
    
    showMenu() {
        if (this.menu) {
            this.menu.classList.remove('hidden');
        }
    }
    
    hideMenu() {
        if (this.menu) {
            this.menu.classList.add('hidden');
        }
    }
    
    showGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.remove('hidden');
        }
    }
    
    showWinScreen() {
        if (this.winScreen) {
            this.winScreen.classList.remove('hidden');
        }
    }
}
