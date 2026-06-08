export class Inventory {
    constructor() {
        this.items = new Array(5).fill(null);
        this.slots = [];
        this.createUI();
    }
    
    createUI() {
        const inventoryDiv = document.getElementById('inventory');
        if (!inventoryDiv) return;
        
        inventoryDiv.innerHTML = '';
        inventoryDiv.style.display = 'flex';
        inventoryDiv.style.gap = '10px';
        inventoryDiv.style.flexDirection = 'row';
        
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.style.width = '50px';
            slot.style.height = '50px';
            slot.style.background = 'rgba(0,0,0,0.7)';
            slot.style.border = '1px solid #ffaa44';
            slot.style.borderRadius = '5px';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            slot.style.fontSize = '24px';
            slot.style.position = 'relative';
            
            const indexSpan = document.createElement('span');
            indexSpan.textContent = i + 1;
            indexSpan.style.position = 'absolute';
            indexSpan.style.bottom = '2px';
            indexSpan.style.right = '5px';
            indexSpan.style.fontSize = '10px';
            indexSpan.style.color = '#aaa';
            slot.appendChild(indexSpan);
            
            const itemSpan = document.createElement('span');
            itemSpan.className = 'slot-item';
            itemSpan.textContent = '';
            slot.appendChild(itemSpan);
            
            inventoryDiv.appendChild(slot);
            this.slots.push({ slot, itemSpan });
        }
        
        this.updateUI();
    }
    
    addItem(id, icon, slotIndex = null) {
        // Ищем первый свободный слот
        let targetSlot = slotIndex;
        if (targetSlot === null) {
            targetSlot = this.items.findIndex(item => item === null);
        }
        
        if (targetSlot !== -1 && targetSlot < 5) {
            this.items[targetSlot] = { id, icon };
            this.updateUI();
            return true;
        }
        return false;
    }
    
    hasItem(id) {
        return this.items.some(item => item && item.id === id);
    }
    
    removeItem(id) {
        const index = this.items.findIndex(item => item && item.id === id);
        if (index !== -1) {
            this.items[index] = null;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    getItemAt(slot) {
        return this.items[slot];
    }
    
    updateUI() {
        for (let i = 0; i < 5; i++) {
            const item = this.items[i];
            if (item) {
                this.slots[i].itemSpan.textContent = item.icon;
            } else {
                this.slots[i].itemSpan.textContent = '';
            }
        }
    }
}
