document.addEventListener('DOMContentLoaded', () => {
    let coefficients = Array.from({ length: 6 }, () => ["", ""]); // Поля для ввода чистые
    let averagePlayer1 = 0;
    let averagePlayer2 = 0;
    let totalPrediction = "";
    let differenceColor = "green";
    let smallestPlayerPoints = 0;
    let winner = 0;
    let gameComments = Array(6).fill("");
    let aiAnalysis = "";
    let aiEnabled = true;
    let winProbabilityPlayer1 = 50;
    let winProbabilityPlayer2 = 50;

    // DOM Elements
    const averagePlayer1El = document.getElementById('averagePlayer1');
    const averagePlayer2El = document.getElementById('averagePlayer2');
    const winnerEl = document.getElementById('winner');
    const totalPredictionEl = document.getElementById('totalPrediction');
    const smallestPlayerPointsEl = document.getElementById('smallestPlayerPoints');
    const aiAnalysisEl = document.getElementById('aiAnalysis');
    const aiToggle = document.getElementById('aiToggle');
    const inputGrid = document.querySelector('.input-grid');
    const clearButton = document.getElementById('clearButton');
    const virtualKeyboard = document.getElementById('virtualKeyboard');

    let activeInputField = null; // To keep track of the currently focused input

    // Function to format input as "X.XX" or "X.X"
    function formatInput(input) {
        let formatted = input.replace(/[^0-9.]/g, ''); // Удаляем все, кроме цифр и точки

        // Если это первая цифра, автоматически добавляем точку
        if (formatted.length === 1 && formatted.match(/[0-9]/)) {
            formatted += ".";
        }

        // Ограничиваем до 4 символов
        if (formatted.length > 4) {
            formatted = formatted.substring(0, 4);
        }

        // Если точка в начале, добавляем 0
        if (formatted.startsWith('.')) {
            formatted = '0' + formatted;
        }

        // Убедимся, что нет более одной точки
        const parts = formatted.split('.');
        if (parts.length > 2) {
            formatted = parts[0] + '.' + parts.slice(1).join('');
        }

        return formatted;
    }

    function calculateAverages() {
        let totalPlayer1 = 0;
        let totalPlayer2 = 0;
        let validEntriesPlayer1 = 0;
        let validEntriesPlayer2 = 0;

        for (let i = 0; i < 6; i++) {
            const player1Coeff = parseFloat(coefficients[i][0]);
            if (!isNaN(player1Coeff) && player1Coeff > 0) {
                totalPlayer1 += player1Coeff;
                validEntriesPlayer1 += 1;
            }
            const player2Coeff = parseFloat(coefficients[i][1]);
            if (!isNaN(player2Coeff) && player2Coeff > 0) {
                totalPlayer2 += player2Coeff;
                validEntriesPlayer2 += 1;
            }
        }

        averagePlayer1 = validEntriesPlayer1 > 0 ? totalPlayer1 / validEntriesPlayer1 : 0;
        averagePlayer2 = validEntriesPlayer2 > 0 ? totalPlayer2 / validEntriesPlayer2 : 0;

        const difference = Math.abs(averagePlayer1 - averagePlayer2);

        if (difference <= 0.30) {
            totalPrediction = "ТБ 20.5";
            differenceColor = "green";
        } else {
            totalPrediction = "ТМ 20.5";
            differenceColor = "red";
        }

        const totalCoeff = averagePlayer1 + averagePlayer2;
        const pointsPlayer1 = totalCoeff > 0 ? (averagePlayer1 / totalCoeff) * 21 : 0;
        const pointsPlayer2 = totalCoeff > 0 ? (averagePlayer2 / totalCoeff) * 21 : 0;

        smallestPlayerPoints = Math.min(pointsPlayer1, pointsPlayer2);
        if (isNaN(smallestPlayerPoints)) smallestPlayerPoints = 0;

        if (averagePlayer1 < averagePlayer2 && averagePlayer1 > 0) {
            winner = 1;
        } else if (averagePlayer2 < averagePlayer1 && averagePlayer2 > 0) {
            winner = 2;
        } else {
            winner = 0;
        }

        detectKeyMoments();

        if (aiEnabled) {
            runAIAnalysis();
        }

        updateUI();
    }

    function detectKeyMoments() {
        gameComments = Array(6).fill("");

        for (let i = 1; i < 6; i++) {
            const prevPlayer1 = parseFloat(coefficients[i - 1][0]);
            const prevPlayer2 = parseFloat(coefficients[i - 1][1]);
            const currentPlayer1 = parseFloat(coefficients[i][0]);
            const currentPlayer2 = parseFloat(coefficients[i][1]);

            if (!isNaN(prevPlayer1) && !isNaN(prevPlayer2) && !isNaN(currentPlayer1) && !isNaN(currentPlayer2) &&
                prevPlayer1 > 0 && prevPlayer2 > 0 && currentPlayer1 > 0 && currentPlayer2 > 0) {

                const changePlayer1 = Math.abs(currentPlayer1 - prevPlayer1);
                const changePlayer2 = Math.abs(currentPlayer2 - prevPlayer2);

                if (changePlayer1 > 0.40 || changePlayer2 > 0.40) {
                    if (currentPlayer1 > prevPlayer1) { // Коэффициент вырос - теряет преимущество
                        gameComments[i] = "Игрок 1 теряет!";
                    } else if (currentPlayer2 > prevPlayer2) { // Коэффициент вырос - теряет преимущество
                        gameComments[i] = "Игрок 2 теряет!";
                    } else if (currentPlayer1 < prevPlayer1) { // Коэффициент упал - усиливает
                        gameComments[i] = "Игрок 1 усиливает!";
                    } else if (currentPlayer2 < prevPlayer2) { // Коэффициент упал - усиливает
                        gameComments[i] = "Игрок 2 усиливает!";
                    }
                }
            }
        }
    }

    function runAIAnalysis() {
        let scorePlayer1 = 0.0;
        let scorePlayer2 = 0.0;
        let fluctuation1 = 0; // Количество сильных изменений кф1
        let fluctuation2 = 0; // Количество сильных изменений кф2
        let gainMoments1 = 0; // Количество раз, когда кф1 улучшался (становился меньше)
        let gainMoments2 = 0; // Количество раз, когда кф2 улучшался (становился меньше)

        for (let i = 1; i < 6; i++) {
            const prev1 = parseFloat(coefficients[i - 1][0]);
            const prev2 = parseFloat(coefficients[i - 1][1]);
            const curr1 = parseFloat(coefficients[i][0]);
            const curr2 = parseFloat(coefficients[i][1]);

            if (!isNaN(prev1) && !isNaN(prev2) && !isNaN(curr1) && !isNaN(curr2) &&
                prev1 > 0 && prev2 > 0 && curr1 > 0 && curr2 > 0) {

                const diff1 = Math.abs(curr1 - prev1);
                const diff2 = Math.abs(curr2 - prev2);

                if (diff1 > 0.3) { fluctuation1 += 1; }
                if (diff2 > 0.3) { fluctuation2 += 1; }

                if (curr1 < prev1) { gainMoments1 += 1; } // Игрок улучшает кф (становится меньше)
                if (curr2 < prev2) { gainMoments2 += 1; } // Игрок улучшает кф (становится меньше)
            }
        }

        // Логика AI: Чем ниже средний кф, тем лучше (умножаем на 2 для большего веса)
        // Вычитаем флуктуации (нестабильность), добавляем моменты усиления (стабильный рост/удержание)
        scorePlayer1 = (averagePlayer1 > 0 ? (1 / averagePlayer1) * 2 : 0) - fluctuation1 * 0.5 + gainMoments1;
        scorePlayer2 = (averagePlayer2 > 0 ? (1 / averagePlayer2) * 2 : 0) - fluctuation2 * 0.5 + gainMoments2;

        const totalScore = scorePlayer1 + scorePlayer2;
        if (totalScore > 0) {
            winProbabilityPlayer1 = Math.round((scorePlayer1 / totalScore) * 100);
            winProbabilityPlayer2 = 100 - winProbabilityPlayer1;
        } else {
            winProbabilityPlayer1 = 50;
            winProbabilityPlayer2 = 50;
        }

        if (scorePlayer1 > scorePlayer2) {
            aiAnalysis = `🤖 Игрок 1: ${winProbabilityPlayer1}%`;
        } else if (scorePlayer2 > scorePlayer1) {
            aiAnalysis = `🤖 Игрок 2: ${winProbabilityPlayer2}%`;
        } else {
            aiAnalysis = "🤖 Матч равный: 50/50.";
        }
    }

    function updateUI() {
        averagePlayer1El.textContent = averagePlayer1.toFixed(2);
        averagePlayer2El.textContent = averagePlayer2.toFixed(2);
        winnerEl.textContent = winner === 1 ? "1" : winner === 2 ? "2" : "-";
        totalPredictionEl.textContent = totalPrediction;
        totalPredictionEl.className = `prediction-text ${differenceColor}`;
        smallestPlayerPointsEl.textContent = smallestPlayerPoints.toFixed(2);
        aiAnalysisEl.textContent = aiAnalysis;
        aiAnalysisEl.style.display = aiEnabled ? 'block' : 'none';

        for (let i = 0; i < 6; i++) {
            const player1Input = document.getElementById(`player1_game${i + 5}`);
            const player2Input = document.getElementById(`player2_game${i + 5}`);
            const commentEl = document.getElementById(`comment_game${i + 5}`);
            const rowEl = document.getElementById(`row_game${i + 5}`);

            // Update input values from coefficients array
            if (player1Input) player1Input.value = coefficients[i][0];
            if (player2Input) player2Input.value = coefficients[i][1];

            if (commentEl) {
                commentEl.textContent = gameComments[i];
                // Добавляем/убираем класс highlight только если есть комментарий
                rowEl.classList.toggle('highlight', gameComments[i] !== "");
            }
        }
    }

    function clearData() {
        coefficients = Array.from({ length: 6 }, () => ["", ""]); // Очищаем поля
        averagePlayer1 = 0;
        averagePlayer2 = 0;
        totalPrediction = "";
        differenceColor = "green";
        smallestPlayerPoints = 0;
        winner = 0;
        gameComments = Array(6).fill("");
        aiAnalysis = "";
        winProbabilityPlayer1 = 50;
        winProbabilityPlayer2 = 50;
        updateUI();
    }

    function setupInputFields() {
        inputGrid.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('input-row');
            rowDiv.id = `row_game${i + 5}`;
            
            const gameLabel = document.createElement('span');
            gameLabel.classList.add('game-label');
            gameLabel.textContent = `Гейм ${i + 5}`;
            rowDiv.appendChild(gameLabel);

            const input1 = document.createElement('input');
            input1.type = 'text';
            input1.id = `player1_game${i + 5}`;
            input1.placeholder = 'Кф1'; // Сокращено
            input1.dataset.row = i;
            input1.dataset.col = 0;
            input1.setAttribute('inputmode', 'none'); // Отключаем нативную клавиатуру
            input1.addEventListener('focus', (e) => {
                activeInputField = e.target;
                virtualKeyboard.classList.remove('hidden');
            });
            rowDiv.appendChild(input1);

            const input2 = document.createElement('input');
            input2.type = 'text';
            input2.id = `player2_game${i + 5}`;
            input2.placeholder = 'Кф2'; // Сокращено
            input2.dataset.row = i;
            input2.dataset.col = 1;
            input2.setAttribute('inputmode', 'none'); // Отключаем нативную клавиатуру
            input2.addEventListener('focus', (e) => {
                activeInputField = e.target;
                virtualKeyboard.classList.remove('hidden');
            });
            rowDiv.appendChild(input2);

            const commentSpan = document.createElement('p');
            commentSpan.classList.add('comment');
            commentSpan.id = `comment_game${i + 5}`;
            rowDiv.appendChild(commentSpan);

            inputGrid.appendChild(rowDiv);
        }
    }

    // Virtual Keyboard Logic
    virtualKeyboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('key') || e.target.classList.contains('key-done')) {
            const value = e.target.dataset.value;
            if (!activeInputField) return;

            let row = parseInt(activeInputField.dataset.row);
            let col = parseInt(activeInputField.dataset.col);

            if (value === 'backspace') {
                activeInputField.value = activeInputField.value.slice(0, -1);
            } else if (value === 'done') {
                activeInputField.blur(); // Hide keyboard explicitly
                virtualKeyboard.classList.add('hidden'); // Ensure it's hidden
                activeInputField = null; // Clear active field
                return; // Stop further processing
            } else {
                let currentVal = activeInputField.value;
                // Автоматическая точка после первой цифры, если ее еще нет
                if (currentVal.length === 1 && currentVal.match(/[0-9]/) && value !== '.' && !currentVal.includes('.')) {
                    activeInputField.value += '.' + value;
                } else if (currentVal.length < 4) { // Ограничение на 4 символа
                    activeInputField.value += value;
                }
            }
            
            // Update the coefficients array and recalculate
            coefficients[row][col] = formatInput(activeInputField.value);
            calculateAverages();

            // Автоматический переход к следующему полю после ввода 3 символов (X.XX)
            if (activeInputField.value.length === 4) {
                if (col === 0) { // Игрок 1, переходим к Игроку 2
                    const nextInput = document.getElementById(`player2_game${row + 5}`);
                    if (nextInput) nextInput.focus();
                } else if (col === 1) { // Игрок 2, переходим к Игроку 1 следующего гейма
                    if (row < 5) {
                        const nextInput = document.getElementById(`player1_game${row + 6}`);
                        if (nextInput) nextInput.focus();
                    } else { // Последнее поле, скрываем клавиатуру
                        activeInputField.blur();
                        virtualKeyboard.classList.add('hidden');
                        activeInputField = null;
                    }
                }
            }
        }
    });

    // Обработчик для скрытия клавиатуры при тапе вне полей ввода и клавиатуры
    document.addEventListener('click', (e) => {
        if (activeInputField && !activeInputField.contains(e.target) && !virtualKeyboard.contains(e.target)) {
            // Убеждаемся, что клик был вне активного поля и вне клавиатуры
            activeInputField.blur();
            virtualKeyboard.classList.add('hidden');
            activeInputField = null;
        }
    });

    // Event listeners
    aiToggle.addEventListener('change', (e) => {
        aiEnabled = e.target.checked;
        calculateAverages();
    });

    clearButton.addEventListener('click', clearData);

    // Initial setup
    setupInputFields();
    clearData(); // Вызываем clearData для инициализации всех полей пустыми
});
