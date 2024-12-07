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

// Добавляем новые переменные для отслеживания поведения игрока
let sessionStartTime = Date.now();
let totalSpins = 0;
let totalBets = 0;
let totalWins = 0;
let consecutiveLosses = 0;
let biggestWin = 0;
let lastDepositAmount = 0;
let depositsCount = 0;
let totalDeposits = 0;          // Общая сумма депозитов
let maxWinStreak = 0;          // Максимальная серия выигрышей
let currentWinStreak = 0;      // Текущая серия выигрышей
let lastWinAmount = 0;         // Последний выигрыш
let betIncreaseCount = 0;      // Сколько раз игрок повышал ставку
let timeSpentPlaying = 0;      // Время игры в минутах
let startPlayTime = Date.now();

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

    const symbolPositions = {};
    results.forEach((symbol, index) => {
        if (!symbolPositions[symbol]) {
            symbolPositions[symbol] = [];
        }
        symbolPositions[symbol].push(index + 1);
    });

    for (const [symbol, positions] of Object.entries(symbolPositions)) {
        if (positions.length >= 2) {
            const baseMultiplier = getSymbolMultiplier(symbol);
            
            if (positions.length === 5) {
                const win = currentBet * baseMultiplier;
                addWinningCombo('5x', symbol, baseMultiplier, win, 'все окна');
                break;
            }
            else if (positions.length === 4) {
                const multiplier = baseMultiplier * 0.4;
                const win = Math.floor(currentBet * multiplier);
                addWinningCombo('4x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            }
            else if (positions.length === 3) {
                const multiplier = baseMultiplier * 0.2;
                const win = Math.floor(currentBet * multiplier);
                addWinningCombo('3x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            }
            else if (positions.length === 2) {
                const multiplier = baseMultiplier * 0.1;
                const win = Math.floor(currentBet * multiplier);
                addWinningCombo('2x', symbol, multiplier, win, `окна ${positions.join('-')}`);
            }
        }
    }

    // Ограничение максимально��о выигрыша
    if (lastDepositAmount && totalWin > lastDepositAmount * 0.3) {
        const limitedWin = Math.floor(lastDepositAmount * 0.3);
        const ratio = limitedWin / totalWin;
        winningCombinations.forEach(combo => {
            combo.win = Math.floor(combo.win * ratio);
        });
        totalWin = limitedWin;
    }

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

    // Если игрок уже в большом плюсе, снижаем шансы на выигрыш
    if (balance > lastDepositAmount * 1.5) {
        symbols[0].weight = 1;  // Сильно снижаем шанс выпадения 7️⃣
        symbols[1].weight = 1;  // Сильно снижаем шанс выпадения 💎
        symbols[2].weight = 2;  // Снижаем шанс выпадения 🎰
    } else {
        // Возвращаем обычные веса
        symbols[0].weight = 1;
        symbols[1].weight = 2;
        symbols[2].weight = 3;
    }

    totalSpins++;
    totalBets += currentBet;

    const winChance = calculateWinChance();
    const willWin = Math.random() < winChance;

    // Определяем размер возможного выигрыша
    let maxPossibleWin = currentBet * 2;
    if (balance > lastDepositAmount * 1.5) {
        maxPossibleWin = currentBet * 1.2; // Ограничиваем выигрыш если игрок в большом плюсе
    }

    // Продолжаем с существующей логикой анимации...
    spinButton.disabled = true;
    updateBalance(-currentBet);

    const finalSymbols = slots.map(() => {
        if (willWin) {
            // Если должен быть выигрыш, увеличиваем шанс выпадения ценных символов
            const highValueSymbols = symbols.slice(0, 3);
            return highValueSymbols[Math.floor(Math.random() * highValueSymbols.length)].icon;
        }
        return getRandomSymbol();
    });

    // Остальной код спина остается без изменений...
    const promises = slots.map((slot, index) => 
        animateSlot(slot, finalSymbols[index], 3000 + (index * 400))
    );

    Promise.all(promises).then(() => {
        const result = checkWin(finalSymbols);
        
        if (result.totalWin > 0) {
            consecutiveLosses = 0;
            totalWins += result.totalWin;
            biggestWin = Math.max(biggestWin, result.totalWin);
            
            // Если игрок выиграл слишком много, уменьшаем шансы на следующие спины
            if (result.totalWin > lastDepositAmount * 0.5) {
                symbols[0].weight = 1;  // Уменьшаем шанс выпадения 7️⃣
                symbols[1].weight = 2;  // Уменьшаем шанс выпадения 💎
            }
            
            showWinModal(result.totalWin, result.combinations);
            updateBalance(result.totalWin);
        } else {
            consecutiveLosses++;
        }
        
        // Если баланс стал меньше 30% от депозита, немного увеличиваем шансы
        if (balance < lastDepositAmount * 0.3) {
            symbols[0].weight = 2;
            symbols[1].weight = 3;
        }
        
        spinButton.disabled = balance < currentBet;
    });
}

function deposit() {
    const amount = parseInt(prompt('Введите сумму для пополнения (₽):'));
    if (amount && amount > 0) {
        lastDepositAmount = amount;
        totalDeposits += amount;
        depositsCount++;
        
        // Даем более высокие шансы на первый депозит
        if (depositsCount === 1) {
            startPlayTime = Date.now(); // Сбрасываем время игры
            currentWinStreak = 0;
        }
        
        // Если это повторный депозит после проигрыша, даем утешительный шанс
        if (balance < lastDepositAmount * 0.2) {
            setTimeout(() => {
                alert("Спасибо за доверие! Следующие 5 спинов будут с повышенным шансом на выигрыш!");
            }, 1000);
        }

        updateBalance(amount);
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
    
    // Показываем модальное окно с анимацией
    winModal.style.display = 'flex';
    // Форсируем перерисовку
    winModal.offsetHeight;
    winModal.classList.add('show');
}

function hideWinModal() {
    // Добавляем класс для анимации закрытия
    winModal.classList.add('hiding');
    winModal.classList.remove('show');
    
    // Ждем окончания анимации перед полным скрытием
    setTimeout(() => {
        winModal.style.display = 'none';
        winModal.classList.remove('hiding');
    }, 300); // Время должно совпадать с длительностью transition в CSS
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

// Добавляем функцию расчета вероятности выигрыша
function calculateWinChance() {
    const betRatio = currentBet / balance;
    const profitRatio = (balance - lastDepositAmount) / lastDepositAmount;
    
    let baseChance = 0.35; // Снижаем базовый шанс до 35%

    // Контроль максимального выигрыша
    if (balance > lastDepositAmount * 1.2) {
        baseChance *= 0.5; // Резко снижаем шансы если баланс больше депозита на 20%
    }

    // Снижаем шансы при высоких ставках
    if (betRatio > 0.2) {
        baseChance *= 0.7;
    }

    // Если игрок уже в минусе, даем небольшой шанс отыграться
    if (balance < lastDepositAmount * 0.5) {
        baseChance *= 1.2;
    }

    // Снижаем шансы с каждым спином
    baseChance *= Math.max(0.5, 1 - (totalSpins * 0.01));

    return Math.max(0.1, Math.min(0.4, baseChance));
}

// Добавляем функцию для мотивации увеличения ставок
function suggestBetIncrease() {
    if (currentWinStreak >= 2 && currentBet < balance * 0.3) {
        setTimeout(() => {
            alert("Удачная серия! Попробуйте увеличить ставку для большего выигрыша!");
        }, 1000);
    }
}

// Добавляем функцию для предложения депозита
function showDepositSuggestion() {
    if (balance < currentBet) {
        const suggestion = `Недостаточно средств! Пополните баланс на ${currentBet * 10}₽ и получите бонусные спины!`;
        alert(suggestion);
    }
}