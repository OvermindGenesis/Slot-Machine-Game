const symbols = [
    { icon: '7️⃣', weight: 1, name: 'seven', label: 'SEVEN', value: 100 },    // Самый редкий, самый ценный
    { icon: '💎', weight: 2, name: 'diamond', label: 'DIAM', value: 50 },    // Редкий, очень ценный
    { icon: '🎰', weight: 3, name: 'slot', label: 'SLOT', value: 25 },      // Необычный, средне-высокий
    { icon: '⭐', weight: 4, name: 'star', label: 'STAR', value: 15 },      // Обычный, средний
    { icon: '🔔', weight: 4, name: 'bell', label: 'BELL', value: 10 },      // Обычный, низкий
    { icon: '🍒', weight: 5, name: 'cherry', label: 'CHRY', value: 5 }      // Частый, самый низкий
];

let balance = 100;
let currentBet = 10;

const slots = Array.from(document.querySelectorAll('.slot'));
const spinButton = document.getElementById('spinButton');
const balanceDisplay = document.getElementById('balance');
const currentBetDisplay = document.getElementById('currentBet');
const increaseBetBtn = document.getElementById('increaseBet');
const decreaseBetBtn = document.getElementById('decreaseBet');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');
const winModal = document.getElementById('winModal');
const winAmountDisplay = document.getElementById('winAmount');
const closeModalBtn = document.getElementById('closeModal');
const infoButton = document.getElementById('infoButton');
const infoContent = document.getElementById('infoContent');

function getRandomSymbol() {
    const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of symbols) {
        random -= symbol.weight;
        if (random <= 0) {
            return symbol.icon;
        }
    }
    return symbols[0].icon;
}

function getSymbolMultiplier(symbolIcon) {
    const symbolData = symbols.find(s => s.icon === symbolIcon);
    if (!symbolData) return 5;
    return symbolData.value;
}

function getSymbolLabel(symbolIcon) {
    const symbolData = symbols.find(s => s.icon === symbolIcon);
    return symbolData ? symbolData.label : '????';
}

function checkWin(results) {
    let totalWin = 0;
    const winningCombinations = [];
    
    function addWinningCombo(type, symbol, multiplier, win, position) {
        winningCombinations.push({ 
            type, 
            symbol, 
            multiplier, 
            win,
            position 
        });
        totalWin += win;
    }

    // Find all positions of each symbol
    const symbolPositions = {};
    results.forEach((symbol, index) => {
        if (!symbolPositions[symbol]) {
            symbolPositions[symbol] = [];
        }
        symbolPositions[symbol].push(index + 1);
    });

    // Process each symbol's combinations
    for (const [symbol, positions] of Object.entries(symbolPositions)) {
        if (positions.length >= 2) {
            const baseMultiplier = getSymbolMultiplier(symbol);
            
            // Check for 5 of a kind (highest priority)
            if (positions.length === 5) {
                const win = currentBet * baseMultiplier;
                addWinningCombo('5x', symbol, baseMultiplier, win, 'все окна');
                return { totalWin, combinations: winningCombinations }; // Jackpot!
            }

            // Check for best possible combination
            if (positions.length === 4) {
                // 4 of a kind
                const multiplier = Math.floor(baseMultiplier * 0.4);
                const win = currentBet * multiplier;
                addWinningCombo('4x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            } else if (positions.length === 3) {
                // 3 of a kind
                const multiplier = Math.floor(baseMultiplier * 0.2);
                const win = currentBet * multiplier;
                addWinningCombo('3x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            } else if (positions.length === 2) {
                // Single pair
                const multiplier = Math.floor(baseMultiplier * 0.1);
                const win = currentBet * multiplier;
                addWinningCombo('2x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            }
        }
    }

    console.log('Символы на линии:', results.map(getSymbolLabel).join(' | '));
    console.log('Позиции символов:', symbolPositions);
    console.log('Найденные комбинации:', winningCombinations);
    console.log('Общий выигрыш:', totalWin);

    return { totalWin, combinations: winningCombinations };
}

function updateBalance(amount) {
    balance += amount;
    balanceDisplay.textContent = balance;
    spinButton.disabled = balance < currentBet;
    withdrawButton.disabled = balance <= 0;
}

function updateBet(amount) {
    currentBet = Math.max(10, Math.min(100, amount));
    currentBetDisplay.textContent = currentBet;
    spinButton.disabled = balance < currentBet;
}

function createSlotContent(slot) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slot-wrapper';
    wrapper.style.transition = 'none';
    
    // Создаем начальные символы с запасом
    for (let i = 0; i < 10; i++) {
        const symbolDiv = document.createElement('div');
        symbolDiv.className = 'symbol';
        symbolDiv.textContent = getRandomSymbol();
        wrapper.appendChild(symbolDiv);
    }
    
    slot.innerHTML = '';
    slot.appendChild(wrapper);
    return wrapper;
}

function animateSlot(slot, finalSymbol, duration) {
    return new Promise(resolve => {
        const wrapper = createSlotContent(slot);
        const symbols = wrapper.children;
        let currentPos = 0;
        const totalSpins = 6;
        const interval = duration / totalSpins;
        const stepSize = 87;
        let speed = 0;
        let acceleration = 0.8;
        let maxSpeed = 35;
        let isSlowingDown = false;
        let lastTime = performance.now();
        let finalSequenceAdded = false;

        function animate(currentTime) {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            if (!isSlowingDown) {
                speed = Math.min(speed + acceleration, maxSpeed);
            } else {
                speed = Math.max(speed - acceleration * 0.4, 0);
                
                // Добавляем случайные символы во время замедления
                if (!finalSequenceAdded && speed < maxSpeed * 0.5) {
                    finalSequenceAdded = true;
                    for (let i = 0; i < 7; i++) {
                        const newSymbol = document.createElement('div');
                        newSymbol.className = 'symbol';
                        // Используем случайные символы, кроме позиции для выигрышной линии
                        newSymbol.textContent = i === 1 ? finalSymbol : getRandomSymbol();
                        wrapper.appendChild(newSymbol);
                    }
                }
            }

            currentPos += speed;
            
            if (currentPos >= stepSize * 5) {
                currentPos = 0;
                // Удаляем старые символы
                for (let i = 0; i < 5; i++) {
                    if (wrapper.children.length > 7) {
                        wrapper.removeChild(wrapper.children[0]);
                        // Добавляем новый случайный символ
                        const newSymbol = document.createElement('div');
                        newSymbol.className = 'symbol';
                        newSymbol.textContent = getRandomSymbol();
                        wrapper.appendChild(newSymbol);
                    }
                }
            }

            wrapper.style.transform = `translateY(${currentPos}px)`;

            if (speed > 0.1) {
                requestAnimationFrame(animate);
            } else if (isSlowingDown) {
                wrapper.style.transform = 'translateY(0)';
                
                while (wrapper.children.length > 7) {
                    wrapper.removeChild(wrapper.children[0]);
                }
                
                // Set the final symbol exactly where the red line is
                symbols[2].textContent = finalSymbol; // Position 2 is where the red line is
                
                resolve();
            } else {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);

        setTimeout(() => {
            isSlowingDown = true;
        }, duration * 0.6);
    });
}

function spin() {
    if (balance < currentBet) {
        alert('Недостаточно средств!');
        return;
    }

    spinButton.disabled = true;
    updateBalance(-currentBet);

    const finalSymbols = slots.map(() => getRandomSymbol());
    console.log('Final symbols (red line):', finalSymbols.map(getSymbolLabel).join(' | '));
    
    const promises = slots.map((slot, index) => 
        animateSlot(slot, finalSymbols[index], 3000 + (index * 400))
    );

    Promise.all(promises).then(() => {
        // Get symbols from the red line
        const winningSymbols = slots.map(slot => {
            const wrapper = slot.querySelector('.slot-wrapper');
            return wrapper.children[2].textContent; // Position 2 is where the red line is
        });
        
        console.log('Checking symbols on red line:', winningSymbols.map(getSymbolLabel).join(' | '));
        
        const result = checkWin(winningSymbols);
        if (result.totalWin > 0) {
            setTimeout(() => {
                showWinModal(result.totalWin, result.combinations);
                updateBalance(result.totalWin);
            }, 500);
        } else {
            console.log('No winning combinations found');
        }
        spinButton.disabled = balance < currentBet;
    });
}

function deposit() {
    const amount = parseInt(prompt('Введите сумму для пополнения (₽):'));
    if (amount && amount > 0) {
        updateBalance(amount);
        alert(`Баланс пополнен на ₽${amount}`);
    }
}

function withdraw() {
    if (balance <= 0) {
        alert('Нет доступных средств для вывода');
        return;
    }
    const amount = parseInt(prompt('Введите сумму для вывода (₽):'));
    if (amount && amount > 0 && amount <= balance) {
        updateBalance(-amount);
        alert(`Вы вывели ₽${amount}`);
    } else {
        alert('Неверная сумма для вывода');
    }
}

function showWinModal(amount, combinations) {
    winAmountDisplay.textContent = amount;
    
    const modalContent = winModal.querySelector('.modal-content');
    modalContent.innerHTML = '';
    
    // Добавляем анимацию
    const winAnimation = document.createElement('div');
    winAnimation.className = 'win-animation';
    winAnimation.textContent = '🎉';
    modalContent.appendChild(winAnimation);
    
    // Добавляем заголовок
    const title = document.createElement('h2');
    title.textContent = 'ПОЗДРАВЛЯЕМ!';
    modalContent.appendChild(title);
    
    // Добавляем сумму выигрыша
    const winText = document.createElement('p');
    winText.innerHTML = `Вы выиграли <span id="winAmount">${amount}</span>₽`;
    modalContent.appendChild(winText);
    
    // Добавляем описание выигрышных комбинаций
    const combinationsDiv = document.createElement('div');
    combinationsDiv.className = 'win-combinations';
    combinationsDiv.style.textAlign = 'left';
    combinationsDiv.style.marginBottom = '20px';
    
    combinations.forEach(combo => {
        const comboText = document.createElement('p');
        comboText.style.marginBottom = '10px';
        comboText.innerHTML = `${combo.symbol} ${combo.type} (${combo.position}): <span style="color: #2ecc71">+${combo.win}</span>`;
        combinationsDiv.appendChild(comboText);
    });
    
    modalContent.appendChild(combinationsDiv);
    
    // Добавляем кнопку OK
    const okButton = document.createElement('button');
    okButton.id = 'closeModal';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', hideWinModal);
    modalContent.appendChild(okButton);
    
    winModal.classList.add('show');
}

function hideWinModal() {
    winModal.classList.remove('show');
}

// Event Listeners
spinButton.addEventListener('click', spin);
depositButton.addEventListener('click', deposit);
withdrawButton.addEventListener('click', withdraw);
increaseBetBtn.addEventListener('click', () => updateBet(currentBet + 10));
decreaseBetBtn.addEventListener('click', () => updateBet(currentBet - 10));
closeModalBtn.addEventListener('click', hideWinModal);
winModal.addEventListener('click', (e) => {
    if (e.target === winModal) {
        hideWinModal();
    }
});

infoButton.addEventListener('click', () => {
    infoContent.classList.toggle('show');
    infoButton.textContent = infoContent.classList.contains('show') 
        ? 'СКРЫТЬ ИНФОРМАЦИЮ' 
        : 'ИНФОРМАЦИЯ О ВЫИГРЫШАХ';
});

// Initialize
updateBalance(0);

// Инициализация слотов при загрузке
slots.forEach(slot => {
    createSlotContent(slot);
});