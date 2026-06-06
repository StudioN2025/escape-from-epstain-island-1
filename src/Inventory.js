export class Inventory {
    constructor() {
        this.items = new Map();
        this.ui = document.getElementById('inventory-item');
    }
    
    addItem(id, icon) {
        this.items.set(id, icon);
        this.updateUI();
    }
    
    hasItem(id) {
        return this.items.has(id);
    }
    
    removeItem(id) {
        this.items.delete(id);
        this.updateUI();
    }
    
    updateUI() {
        if (this.ui) {
            const item = Array.from(this.items.values())[0];
            this.ui.textContent = item || '';
            this.ui.style.fontSize = item ? '40px' : '0px';
        }
    }
}
