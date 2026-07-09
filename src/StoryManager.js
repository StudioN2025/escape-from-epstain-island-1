export class StoryManager {
    constructor(ui, inventory) {
        this.ui = ui;
        this.inventory = inventory;
        this.currentQuest = null;
        this.quests = {
            find_key: '🔑 Найдите ключ от двери в подвале',
            escape_basement: '🚪 Откройте дверь и выберитесь из подвала',
            find_boat: '🛶 Найдите лодку на острове',
            find_fuel: '⛽ Найдите канистру с бензином на острове',
            use_fuel: '🛶 Заправьте лодку и уплывите'
        };
    }
    
    startGame() {
        this.addQuest('find_key');
        if (this.ui) this.ui.updateQuest('Осмотрите подвал, возможно ключ где-то здесь...');
    }
    
    addQuest(questId, description = null) {
        this.currentQuest = questId;
        if (this.ui) {
            this.ui.updateQuest(this.quests[questId] || description || questId);
        }
    }
    
    completeQuest(questId) {
        if (this.currentQuest === questId) {
            const nextQuest = this.getNextQuest(questId);
            if (nextQuest) this.addQuest(nextQuest.id);
        }
    }
    
    getNextQuest(currentId) {
        const sequence = ['find_key', 'escape_basement', 'find_boat', 'find_fuel', 'use_fuel'];
        const idx = sequence.indexOf(currentId);
        if (idx !== -1 && idx < sequence.length - 1) {
            return { id: sequence[idx + 1] };
        }
        return null;
    }
}
