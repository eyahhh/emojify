const fs = require("fs");
const path = require("path");

// Garante que a pasta database existe
const dbDir = path.join(__dirname, "../database");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const filePath = path.join(dbDir, "giveaways.json");

function load() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            return [];
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        
        // Se o arquivo estiver vazio, retorna array vazio
        if (!data || data.trim() === '') {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            return [];
        }
        
        const parsed = JSON.parse(data);
        
        // Garante que sempre retorna um array
        if (!Array.isArray(parsed)) {
            console.warn('⚠️ giveaways.json não era um array, resetando...');
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            return [];
        }
        
        return parsed;
    } catch (error) {
        console.error('❌ Erro ao carregar giveaways.json:', error.message);
        // Em caso de erro, recria o arquivo
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        return [];
    }
}

function save(data) {
    try {
        // Valida que data é um array antes de salvar
        if (!Array.isArray(data)) {
            console.error('❌ Tentativa de salvar dados inválidos em giveaways.json');
            return false;
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar giveaways.json:', error.message);
        return false;
    }
}

// 📌 Criar sorteio
function createGiveaway(giveaway) {
    const all = load();
    all.push(giveaway);
    save(all);
}

// 📌 Atualizar sorteio
function updateGiveaway(updated) {
    const all = load();
    const index = all.findIndex(g => g.id === updated.id);
    if (index === -1) return false;
    all[index] = updated;
    save(all);
    return true;
}

// 📌 Pegar um sorteio específico
function getGiveaway(id) {
    const all = load();
    return all.find(g => g.id === id) || null;
}

// 📌 Pegar todos os sorteios
function getAllGiveaways() {
    return load();
}

// 📌 Selecionar ganhadores (Fisher-Yates shuffle)
function pickWinners(giveaway) {
    if (!giveaway.participants || !giveaway.participants.length) return [];
    
    const shuffled = [...giveaway.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, giveaway.winnerCount);
}

// 📌 Deletar sorteio
function deleteGiveaway(id) {
    const all = load();
    const filtered = all.filter(g => g.id !== id);
    save(filtered);
    return filtered.length < all.length;
}

module.exports = {
    createGiveaway,
    updateGiveaway,
    getGiveaway,
    getAllGiveaways,
    pickWinners,
    deleteGiveaway,
    load,
    save
};