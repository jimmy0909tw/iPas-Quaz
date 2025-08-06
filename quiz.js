// 讀取 CSV 並解析
async function loadQuestions() {
    const res = await fetch('questions.csv');
    const text = await res.text();
    const lines = text.trim().split('\n');
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

// 洗牌函式，返回洗牌後的選項及新正確答案位置
function shuffleOptions(options, answerIndex) {
    const arr = options.map((opt, idx) => ({ opt, idx }));
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const shuffledOptions = arr.map(x => x.opt);
    const newAnswerIndex = arr.findIndex(x => x.idx === answerIndex);
    return { shuffledOptions, newAnswerIndex };
}

let quiz = [];
let userAnswers = [];
let current = 0;
let optionOrder = []; // 每題洗牌結果，{options: [...], answer: x}

function renderQuestion() {
    const q = quiz[current];

    // 只在第一次產生選項順序
    if (!optionOrder[current]) {
        const { shuffledOptions, newAnswerIndex } = shuffleOptions(q.options, q.answer);
        optionOrder[current] = { options: shuffledOptions, answer: newAnswerIndex };
    }
    const shuffledOptions = optionOrder[current].options;
    const answerIndex = optionOrder[current].answer;

    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <div class="question">(${current + 1}/${quiz.length}) ${q.question}</div>
        <form id="options-form" class="options">
            ${shuffledOptions.map((opt, i) => `
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
    const shuffled = optionOrder[current];
    const isCorrect = ans === shuffled.answer;
    exp.style.display = 'block';
    exp.innerHTML = isCorrect
        ? "✔️ 答對了！<br>" + q.explanation
        : `<span class="wrong">❌ 答錯了！</span><br>正確答案：${String.fromCharCode(65 + shuffled.answer)}. ${shuffled.options[shuffled.answer]}<br>${q.explanation}`;

    // 下一題或看成績按鈕
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
        if (userAnswers[i] === optionOrder[i].answer) score++;
        else wrongList.push({
            q: quiz[i],
            ans: userAnswers[i],
            order: optionOrder[i]
        });
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
                        <div>你的答案：${w.ans !== undefined ? String.fromCharCode(65 + w.ans) + ". " + (w.order.options[w.ans] || "(未選)") : "(未作答)"}</div>
                        <div>正確答案：${String.fromCharCode(65 + w.order.answer)}. ${w.order.options[w.order.answer]}</div>
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

// 初始化
window.onload = async function() {
    let all = await loadQuestions();
    quiz = pickRandom(all, 30); // 依你的題庫數量可調整
    userAnswers = Array(quiz.length);
    current = 0;
    optionOrder = Array(quiz.length); // 初始化
    renderQuestion();
};
