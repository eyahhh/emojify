const fs = require("fs");
const path = require("path");

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const filePath = path.join(dbDir, "coins.json");

function load() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
            return {};
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        if (!data || data.trim() === '') {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
            return {};
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao carregar coins.json:', error);
        return {};
    }
}

function save(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Erro ao salvar coins.json:', error);
        return false;
    }
}

function addCoins(userId, amount) {
    const data = load();
    if (!data[userId]) data[userId] = 0;
    data[userId] += amount;
    save(data);
    return data[userId];
}

function getCoins(userId) {
    const data = load();
    return data[userId] || 0;
}

function removeCoins(userId, amount) {
    const data = load();
    if (!data[userId]) data[userId] = 0;
    data[userId] = Math.max(0, data[userId] - amount);
    save(data);
    return data[userId];
}

function setCoins(userId, amount) {
    const data = load();
    data[userId] = Math.max(0, amount);
    save(data);
    return data[userId];
}

function ensureUser(userId) {
    const data = load();
    if (!data[userId]) {
        data[userId] = 0;
        save(data);
    }
    return data[userId];
}

module.exports = {
    addCoins,
    getCoins,
    removeCoins,
    setCoins,
    ensureUser,
    load,
    save
};