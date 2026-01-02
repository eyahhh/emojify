const fs = require("fs");
const path = require("path");

const bankFile = path.join(__dirname, "bank.json");

function loadBank() {
    if (!fs.existsSync(bankFile)) {
        fs.writeFileSync(bankFile, JSON.stringify({}, null, 2));
        return {};
    }
    return JSON.parse(fs.readFileSync(bankFile, "utf8"));
}

function saveBank(data) {
    fs.writeFileSync(bankFile, JSON.stringify(data, null, 2));
}

function ensureUserBank(userId) {
    const bank = loadBank();
    if (!bank[userId]) {
        bank[userId] = {
            balance: 0,
            lastInterestTime: Date.now(),
            loan: 0,
            loanDeadline: null,
            loanPaid: false
        };
        saveBank(bank);
    }
    return bank[userId];
}

function getBalance(userId) {
    const bank = loadBank();
    return bank[userId]?.balance || 0;
}

function addBalance(userId, amount) {
    const bank = loadBank();
    ensureUserBank(userId);
    bank[userId].balance += amount;
    saveBank(bank);
}

function removeBalance(userId, amount) {
    const bank = loadBank();
    ensureUserBank(userId);
    bank[userId].balance -= amount;
    saveBank(bank);
}

function setBalance(userId, amount) {
    const bank = loadBank();
    ensureUserBank(userId);
    bank[userId].balance = amount;
    saveBank(bank);
}

function getLoan(userId) {
    const bank = loadBank();
    return bank[userId]?.loan || 0;
}

function createLoan(userId, amount) {
    const bank = loadBank();
    ensureUserBank(userId);
    if (bank[userId].loan > 0) {
        return false; // Já tem empréstimo ativo
    }
    bank[userId].loan = amount;
    bank[userId].loanDeadline = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 dias
    bank[userId].loanPaid = false;
    saveBank(bank);
    return true;
}

function payLoan(userId, amount) {
    const bank = loadBank();
    ensureUserBank(userId);
    
    if (bank[userId].loan <= 0) {
        return false; // Sem empréstimo ativo
    }

    bank[userId].loan -= amount;
    if (bank[userId].loan <= 0) {
        bank[userId].loan = 0;
        bank[userId].loanPaid = true;
    }
    saveBank(bank);
    return true;
}

function chargeLoan(userId) {
    const bank = loadBank();
    ensureUserBank(userId);
    
    if (bank[userId].loan > 0 && bank[userId].loanDeadline < Date.now()) {
        // Cobrar 20% de juros por atraso
        const penalty = Math.ceil(bank[userId].loan * 0.20);
        bank[userId].loan += penalty;
        bank[userId].loanDeadline = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 dias a mais
        saveBank(bank);
        return { charged: true, penalty };
    }
    return { charged: false };
}

function applyInterest(userId) {
    const bank = loadBank();
    ensureUserBank(userId);
    
    const now = Date.now();
    const lastInterest = bank[userId].lastInterestTime || now;
    const hoursPassed = (now - lastInterest) / (1000 * 60 * 60);

    if (hoursPassed >= 1) {
        // 0.7% de juros por hora
        const interest = Math.floor(bank[userId].balance * 0.007);
        bank[userId].balance += interest;
        bank[userId].lastInterestTime = now;
        saveBank(bank);
        return { applied: true, interest };
    }
    
    return { applied: false };
}

function getAllUsers() {
    return loadBank();
}

module.exports = {
    ensureUserBank,
    getBalance,
    addBalance,
    removeBalance,
    setBalance,
    getLoan,
    createLoan,
    payLoan,
    chargeLoan,
    applyInterest,
    getAllUsers
};
