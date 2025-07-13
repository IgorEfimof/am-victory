document.addEventListener('DOMContentLoaded', () => {
    // Состояние приложения
    const state = {
        coefficients: Array.from({ length: 6 }, () => ["", ""]),
        averages: { player1: 0, player2: 0 },
        predictions: { total: "", color: "green", smallestPoints: 0 },
        winner: 0,
        gameComments: Array(6).fill(""),
        aiAnalysis: "",
        aiEnabled: true,
        probabilities: { player1: 50, player2: 50 },
        gameStrengths: Array(6).fill({ player1: 0, player2: 0 }),
        winStreaks: { player1: 0, player2: 0 },
        lastWinner: null
    };

    // DOM Elements
    const elements = {
        averagePlayer1: document.getElementById('averagePlayer1'),
        averagePlayer2: document.getElementById('averagePlayer2'),
        winner: document.getElementById('winner'),
        totalPrediction: document.getElementById('totalPrediction'),
        smallestPlayerPoints: document.getElementById('smallestPlayerPoints'),
        aiAnalysis: document.getElementById('aiAnalysis'),
        aiToggle: document.getElementById('aiToggle'),
        inputGrid: document.querySelector('.input-grid'),
        clearButton: document.getElementById('clearButton'),
        virtualKeyboard: document.getElementById('virtualKeyboard'),
        strengthTable: document.getElementById('strengthTable')
    };

    let activeInputField = null;

    // Инициализация
    function init() {
        setupInputFields();
        setupVirtualKeyboard();
        setupEventListeners();
        updateUI();
    }

    function setupInputFields() {
        elements.inputGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('input-row');
            rowDiv.id = `row_game${i + 5}`;
            
            const gameLabel = document.createElement('span');
            gameLabel.classList.add('game-label');
            gameLabel.textContent = `Гейм ${i + 5}`;
            rowDiv.appendChild(gameLabel);

            const input1 = createInputField(i, 0);
            const input2 = createInputField(i, 1);
            
            rowDiv.appendChild(input1);
            rowDiv.appendChild(input2);

            const commentSpan = document.createElement('p');
            commentSpan.classList.add('comment');
            commentSpan.id = `comment_game${i + 5}`;
            rowDiv.appendChild(commentSpan);

            elements.inputGrid.appendChild(rowDiv);
        }
    }

    function createInputField(row, col) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player${col + 1}_game${row + 5}`;
        input.placeholder = col === 0 ? 'Кф1' : 'Кф2';
        input.dataset.row = row;
        input.dataset.col = col;
        input.setAttribute('inputmode', 'none');
        
        input.addEventListener('focus', (e) => {
            activeInputField = e.target;
            elements.virtualKeyboard.classList.remove('hidden');
        });
        
        return input;
    }

    function setupVirtualKeyboard() {
        elements.virtualKeyboard.addEventListener('click', (e) => {
            if (!activeInputField) return;
            
            const value = e.target.dataset.value;
            const row = parseInt(activeInputField.dataset.row);
            const col = parseInt(activeInputField.dataset.col);

            if (value === 'backspace') {
                activeInputField.value = activeInputField.value.slice(0, -1);
            } else if (value === 'done') {
                activeInputField.blur();
                elements.virtualKeyboard.classList.add('hidden');
                activeInputField = null;
                return;
            } else {
                handleInputValue(value, row, col);
            }
            
            state.coefficients[row][col] = formatInput(activeInputField.value);
            calculateAll();
            handleAutoFocus(row, col);
        });

        document.addEventListener('click', (e) => {
            if (activeInputField && !activeInputField.contains(e.target) {
                activeInputField.blur();
                elements.virtualKeyboard.classList.add('hidden');
                activeInputField = null;
            }
        });
    }

    function handleInputValue(value, row, col) {
        let currentVal = activeInputField.value;
        if (currentVal.length === 1 && /[0-9]/.test(currentVal) && value !== '.' && !currentVal.includes('.')) {
            activeInputField.value += '.' + value;
        } else if (currentVal.length < 4) {
            activeInputField.value += value;
        }
    }

    function handleAutoFocus(row, col) {
        if (activeInputField.value.length === 4) {
            if (col === 0) {
                const nextInput = document.getElementById(`player2_game${row + 5}`);
                if (nextInput) nextInput.focus();
            } else if (row < 5) {
                const nextInput = document.getElementById(`player1_game${row + 6}`);
                if (nextInput) nextInput.focus();
            } else {
                activeInputField.blur();
                elements.virtualKeyboard.classList.add('hidden');
                activeInputField = null;
            }
        }
    }

    function setupEventListeners() {
        elements.aiToggle.addEventListener('change', (e) => {
            state.aiEnabled = e.target.checked;
            calculateAll();
        });

        elements.clearButton.addEventListener('click', clearData);
    }

    // Основные расчетные функции
    function calculateAll() {
        calculateAverages();
        calculateGameStrengths();
        detectKeyMoments();
        if (state.aiEnabled) runAIAnalysis();
        updateUI();
    }

    function calculateAverages() {
        let totals = { player1: 0, player2: 0 };
        let counts = { player1: 0, player2: 0 };

        state.coefficients.forEach(([coeff1, coeff2]) => {
            const num1 = parseFloat(coeff1);
            const num2 = parseFloat(coeff2);

            if (!isNaN(num1) {
                totals.player1 += num1;
                counts.player1++;
            }
            if (!isNaN(num2)) {
                totals.player2 += num2;
                counts.player2++;
            }
        });

        state.averages.player1 = counts.player1 > 0 ? totals.player1 / counts.player1 : 0;
        state.averages.player2 = counts.player2 > 0 ? totals.player2 / counts.player2 : 0;

        const difference = Math.abs(state.averages.player1 - state.averages.player2);
        state.predictions.total = difference <= 0.30 ? "ТБ 20.5" : "ТМ 20.5";
        state.predictions.color = difference <= 0.30 ? "green" : "red";

        const totalCoeff = state.averages.player1 + state.averages.player2;
        const pointsPlayer1 = totalCoeff > 0 ? (state.averages.player1 / totalCoeff) * 21 : 0;
        const pointsPlayer2 = totalCoeff > 0 ? (state.averages.player2 / totalCoeff) * 21 : 0;

        state.predictions.smallestPoints = Math.min(pointsPlayer1, pointsPlayer2) || 0;
        state.winner = state.averages.player1 < state.averages.player2 ? 1 : 
                      state.averages.player2 < state.averages.player1 ? 2 : 0;
    }

    function calculateGameStrengths() {
        state.gameStrengths = state.coefficients.map(([coeff1, coeff2], index) => {
            const gameNum = index + 5;
            const num1 = parseFloat(coeff1);
            const num2 = parseFloat(coeff2);

            if (isNaN(num1) || isNaN(num2)) return { player1: 0, player2: 0 };

            // Вес гейма (W)
            const W = 1 + 0.2 * Math.max(0, gameNum - 5);
            
            // Модификатор динамики (D)
            const D1 = 1 + (state.winStreaks.player1 * 0.1);
            const D2 = 1 + (state.winStreaks.player2 * 0.1);
            
            return {
                player1: (num1 * W * D1).toFixed(2),
                player2: (num2 * W * D2).toFixed(2)
            };
        });
    }

    function detectKeyMoments() {
        state.gameComments = Array(6).fill("");

        for (let i = 1; i < 6; i++) {
            const prev1 = parseFloat(state.coefficients[i-1][0]);
            const prev2 = parseFloat(state.coefficients[i-1][1]);
            const curr1 = parseFloat(state.coefficients[i][0]);
            const curr2 = parseFloat(state.coefficients[i][1]);

            if (!isNaN(prev1) && !isNaN(prev2) && !isNaN(curr1) && !isNaN(curr2)) {
                const change1 = Math.abs(curr1 - prev1);
                const change2 = Math.abs(curr2 - prev2);

                if (change1 > 0.40 || change2 > 0.40) {
                    if (curr1 > prev1) state.gameComments[i] = "Игрок 1 теряет!";
                    else if (curr2 > prev2) state.gameComments[i] = "Игрок 2 теряет!";
                    else if (curr1 < prev1) state.gameComments[i] = "Игрок 1 усиливает!";
                    else if (curr2 < prev2) state.gameComments[i] = "Игрок 2 усиливает!";
                }
            }
        }
    }

    function runAIAnalysis() {
        let scores = { player1: 0, player2: 0 };
        let fluctuations = { player1: 0, player2: 0 };
        let gainMoments = { player1: 0, player2: 0 };

        for (let i = 1; i < 6; i++) {
            const prev1 = parseFloat(state.coefficients[i-1][0]);
            const prev2 = parseFloat(state.coefficients[i-1][1]);
            const curr1 = parseFloat(state.coefficients[i][0]);
            const curr2 = parseFloat(state.coefficients[i][1]);

            if (!isNaN(prev1) && !isNaN(prev2) && !isNaN(curr1) && !isNaN(curr2)) {
                if (Math.abs(curr1 - prev1) > 0.3) fluctuations.player1++;
                if (Math.abs(curr2 - prev2) > 0.3) fluctuations.player2++;
                if (curr1 < prev1) gainMoments.player1++;
                if (curr2 < prev2) gainMoments.player2++;
            }
        }

        scores.player1 = (state.averages.player1 > 0 ? (1 / state.averages.player1) * 2 : 0) 
                        - fluctuations.player1 * 0.5 + gainMoments.player1;
        scores.player2 = (state.averages.player2 > 0 ? (1 / state.averages.player2) * 2 : 0) 
                        - fluctuations.player2 * 0.5 + gainMoments.player2;

        const totalScore = scores.player1 + scores.player2;
        if (totalScore > 0) {
            state.probabilities.player1 = Math.round((scores.player1 / totalScore) * 100);
            state.probabilities.player2 = 100 - state.probabilities.player1;
        }

        state.aiAnalysis = scores.player1 > scores.player2 
            ? `🤖 Игрок 1: ${state.probabilities.player1}%` 
            : scores.player2 > scores.player1 
                ? `🤖 Игрок 2: ${state.probabilities.player2}%` 
                : "🤖 Матч равный: 50/50";
    }

    function updateUI() {
        // Основные показатели
        elements.averagePlayer1.textContent = state.averages.player1.toFixed(2);
        elements.averagePlayer2.textContent = state.averages.player2.toFixed(2);
        elements.winner.textContent = state.winner === 1 ? "1" : state.winner === 2 ? "2" : "-";
        elements.totalPrediction.textContent = state.predictions.total;
        elements.totalPrediction.className = `prediction-text ${state.predictions.color}`;
        elements.smallestPlayerPoints.textContent = state.predictions.smallestPoints.toFixed(2);
        elements.aiAnalysis.textContent = state.aiAnalysis;
        elements.aiAnalysis.style.display = state.aiEnabled ? 'block' : 'none';

        // Обновление полей ввода и комментариев
        state.coefficients.forEach(([coeff1, coeff2], i) => {
            const player1Input = document.getElementById(`player1_game${i + 5}`);
            const player2Input = document.getElementById(`player2_game${i + 5}`);
            const commentEl = document.getElementById(`comment_game${i + 5}`);
            const rowEl = document.getElementById(`row_game${i + 5}`);

            if (player1Input) player1Input.value = coeff1;
            if (player2Input) player2Input.value = coeff2;
            if (commentEl) {
                commentEl.textContent = state.gameComments[i];
                rowEl.classList.toggle('highlight', state.gameComments[i] !== "");
            }
        });

        // Обновление таблицы силы геймов
        updateStrengthTable();
    }

    function updateStrengthTable() {
        if (!elements.strengthTable) return;
        
        elements.strengthTable.innerHTML = `
            <tr>
                <th>Гейм</th>
                <th>Сила Игрока 1</th>
                <th>Сила Игрока 2</th>
                <th>Отклонение</th>
            </tr>
            ${state.gameStrengths.map((strength, i) => {
                const gameNum = i + 5;
                const deviation1 = calculateDeviation(strength.player1, state.averages.player1);
                const deviation2 = calculateDeviation(strength.player2, state.averages.player2);
                
                return `
                <tr>
                    <td>${gameNum}</td>
                    <td>${strength.player1}</td>
                    <td>${strength.player2}</td>
                    <td style="color: ${getDeviationColor(deviation1)}">
                        ${deviation1}% / ${deviation2}%
                    </td>
                </tr>
                `;
            }).join('')}
        `;
    }

    function calculateDeviation(value, average) {
        const numValue = parseFloat(value);
        const numAverage = parseFloat(average);
        return isNaN(numValue) || numAverage === 0 ? "0" : 
            ((numAverage - numValue) / numAverage * 100).toFixed(1);
    }

    function getDeviationColor(deviation) {
        const num = parseFloat(deviation);
        if (num > 15) return '#2ecc71';
        if (num > 5) return '#27ae60';
        if (num < -15) return '#e74c3c';
        if (num < -5) return '#c0392b';
        return '#3498db';
    }

    function clearData() {
        state.coefficients = Array.from({ length: 6 }, () => ["", ""]);
        state.averages = { player1: 0, player2: 0 };
        state.predictions = { total: "", color: "green", smallestPoints: 0 };
        state.winner = 0;
        state.gameComments = Array(6).fill("");
        state.aiAnalysis = "";
        state.probabilities = { player1: 50, player2: 50 };
        state.gameStrengths = Array(6).fill({ player1: 0, player2: 0 });
        updateUI();
    }

    // Вспомогательные функции
    function formatInput(input) {
        let formatted = input.replace(/[^0-9.]/g, '');
        if (formatted.length === 1 && /[0-9]/.test(formatted)) formatted += ".";
        if (formatted.length > 4) formatted = formatted.substring(0, 4);
        if (formatted.startsWith('.')) formatted = '0' + formatted;
        const parts = formatted.split('.');
        if (parts.length > 2) formatted = parts[0] + '.' + parts.slice(1).join('');
        return formatted;
    }

    // Запуск приложения
    init();
});
