export class Inventory {
    constructor() {
        this.items = new Array(5).fill(null);
        this.slots = [];
        this.createUI();
    }
    
    createUI() {
        const invDiv = document.getElementById('inventory');
        if (!invDiv) {
            console.error('Элемент #inventory не найден в DOM!');
            return;
        }
        invDiv.innerHTML = '';
        invDiv.style.display = 'flex';
        invDiv.style.gap = '10px';
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            const idxSpan = document.createElement('span');
            idxSpan.textContent = i + 1;
            slot.appendChild(idxSpan);
            const itemSpan = document.createElement('span');
            itemSpan.className = 'slot-item';
            slot.appendChild(itemSpan);
            invDiv.appendChild(slot);
            this.slots.push({ slot, itemSpan });
        }
        this.updateUI();
        console.log('Инвентарь создан, слотов:', this.slots.length);
    }
    
    addItem(id, icon) {
        const free = this.items.findIndex(item => item === null);
        console.log(`Добавление предмета ${id}, свободный слот: ${free}`);
        if (free !== -1) {
            this.items[free] = { id, icon };
            this.updateUI();
            console.log(`Предмет ${id} добавлен в слот ${free}. Инвентарь:`, this.items);
            return true;
        }
        console.warn(`Нет свободного слота для ${id}`);
        return false;
    }
    
    hasItem(id) {
        return this.items.some(item => item && item.id === id);
    }
    
    hasFuel() {
        return this.hasItem('fuel');
    }
    
    addFuel() {
        return this.addItem('fuel', '⛽');
    }
    
    removeItem(id) {
        const idx = this.items.findIndex(item => item && item.id === id);
        if (idx !== -1) {
            this.items[idx] = null;
            this.updateUI();
            return true;
        }
        return false;
    }
    
    updateUI() {
        for (let i = 0; i < 5; i++) {
            const item = this.items[i];
            this.slots[i].itemSpan.textContent = item ? item.icon : '';
        }
    }
}
