export class StoryManager {
    constructor(ui, inventory) {
        this.ui = ui;
        this.inventory = inventory;
        this.currentQuest = null;
        this.quests = {
            find_key: '🔑 Найдите ключ от двери в подвале',
            escape_basement: '🚪 Откройте дверь и выберитесь из подвала',
            find_boat: '🛶 Найдите лодку на острове и сбегите от монстра'
        };
    }
    
    startGame() {
        this.addQuest('find_key', '🔑 Найдите ключ от двери в подвале');
        this.ui.updateQuest('Осмотрите подвал, возможно ключ где-то здесь...');
    }
    
    addQuest(questId, description) {
        this.currentQuest = questId;
        this.ui.updateQuest(this.quests[questId] || description);
    }
    
    completeQuest(questId) {
        if (this.currentQuest === questId) {
            const nextQuest = this.getNextQuest(questId);
            if (nextQuest) {
                this.addQuest(nextQuest.id, nextQuest.description);
            }
        }
    }
    
    getNextQuest(currentId) {
        const questSequence = ['find_key', 'escape_basement', 'find_boat'];
        const currentIndex = questSequence.indexOf(currentId);
        if (currentIndex !== -1 && currentIndex < questSequence.length - 1) {
            const nextId = questSequence[currentIndex + 1];
            return { id: nextId, description: this.quests[nextId] };
        }
        return null;
    }
}
