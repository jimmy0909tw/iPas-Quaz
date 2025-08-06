// 讀取 CSV 並解析
async function loadQuestions() {
    const res = await fetch('questions.csv');
    const text = await res.text();
    const lines = text.trim().split('\n');
    const header = lines[0].split(',');
    const questions = lines.slice(1).map(line => {
        // 防止題目或選項裡有逗號，用正則分割 CSV
        const cells = [];
        let re = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
        let match;
        while ((match = re.exec(line)) !== null) {
            let cell = match[1];
            if (cell.startsWith('"') && cell.endsWith('"')) {
                cell = cell.slice(1, -1);
            }
            cells.push(cell);
        }
        return {
            id: cells[0],
            question: cells[1],
            options: [cells[2], cells[3], cells[4], cells[5]],
            answer: parseInt(cells[6], 10) - 1, // 0-based index
            explanation: cells[7]
        };
    });
    return questions;
}

// 隨機取 n 題
function pickRandom(arr, n) {
    const res = [];
    const used = new Set();
    while (res.length < n && res.length < arr.length) {
        const idx = Math.floor(Math.random() * arr.length);
        if (!used.has(idx)) {
            res.push(arr[idx]);
            used.add(idx);
        }
    }
    return res;
}

// 顯示題目
let quiz = [];
let userAnswers = [];
let current = 0;

function renderQuestion() {
    const q = quiz[current];
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <div class="question">(${current + 1}/${quiz.length}) ${q.question}</div>
        <form id="options-form" class="options">
            ${q.options.map((opt, i) => `
                <label>
                    <input type="radio" name="option" value="${i}" required>
                    ${String.fromCharCode(65 + i)}. ${opt}
                </label>
            `).join('')}
            <div class="button-area">
                <button type="submit">提交答案</button>
            </div>
        </form>
        <div class="explanation" id="explanation" style="display:none;"></div>
    `;
    document.getElementById('options-form').onsubmit = function(e) {
        e.preventDefault();
        const form = e.target;
        const ans = parseInt(form.option.value, 10);
        userAnswers[current] = ans;
        showAnswer(q, ans);
    };
}

function showAnswer(q, ans) {
    const exp = document.getElementById('explanation');
    const isCorrect = ans === q.answer;
    exp.style.display = 'block';
    exp.innerHTML = isCorrect
        ? "✔️ 答對了！<br>" + q.explanation
        : `<span class="wrong">❌ 答錯了！</span><br>正確答案：${String.fromCharCode(65 + q.answer)}<br>${q.explanation}`;

    // 下一題按鈕
    const container = document.getElementById('quiz-container');
    if (current < quiz.length - 1) {
        if (!document.getElementById('next-btn')) {
            let btn = document.createElement('button');
            btn.id = 'next-btn';
            btn.innerText = '下一題';
            btn.onclick = () => {
                current++;
                renderQuestion();
            };
            exp.parentElement.appendChild(btn);
        }
    } else {
        if (!document.getElementById('finish-btn')) {
            let btn = document.createElement('button');
            btn.id = 'finish-btn';
            btn.innerText = '看成績';
            btn.onclick = showResult;
            exp.parentElement.appendChild(btn);
        }
    }
}

function showResult() {
    document.getElementById('quiz-container').style.display = 'none';
    const result = document.getElementById('result-container');
    let score = 0;
    let wrongList = [];
    for (let i = 0; i < quiz.length; i++) {
        if (userAnswers[i] === quiz[i].answer) score++;
        else wrongList.push({q: quiz[i], ans: userAnswers[i]});
    }
    result.style.display = 'block';
    result.innerHTML = `
        <div class="score">你的分數：${score} / ${quiz.length}</div>
        ${wrongList.length > 0 ? `
            <div class="wrong-list">
                <strong>你答錯的題目：</strong>
                <ol>
                ${wrongList.map(w => `
                    <li>
                        <div class="question">${w.q.question}</div>
                        <div>你的答案：${w.ans !== undefined ? String.fromCharCode(65 + w.ans) + ". " + (w.q.options[w.ans] || "(未選)") : "(未作答)"}</div>
                        <div>正確答案：${String.fromCharCode(65 + w.q.answer)}. ${w.q.options[w.q.answer]}</div>
                        <div>說明：${w.q.explanation}</div>
                    </li>
                `).join('')}
                </ol>
            </div>
        ` : `<div>全部答對，太厲害了！</div>`}
        <div class="button-area">
            <button onclick="window.location.reload()">再挑戰一次</button>
        </div>
    `;
}

// 初始化
window.onload = async function() {
    let all = await loadQuestions();
    quiz = pickRandom(all, 30); // 你可根據題庫數量調整
    userAnswers = Array(quiz.length);
    current = 0;
    renderQuestion();
};
