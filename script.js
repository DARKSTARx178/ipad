// ========================================================
// RESTRUCTURED SEAMLESS APPLICATION MEMORY STORE
// ========================================================
var state = {
    theme: localStorage.getItem('s_theme') || 'pitch-black',
    blocks: JSON.parse(localStorage.getItem('s_blocks')) || [
        { id: 'b1', type: 'note', x: 40, y: 60, text: 'Brainstorm layout routines' },
        { id: 'b2', type: 'todo', x: 240, y: 140, text: 'Clean studio desk setup', done: false }
    ]
};

function saveState() {
    localStorage.setItem('s_theme', state.theme);
    localStorage.setItem('s_blocks', JSON.stringify(state.blocks));
}

// ========================================================
// BACKGROUND GRADIENT CONFIGURATOR DIALER ENGINE
// ========================================================
var gradientThemes = {
    'pitch-black': '#000000',
    'midnight-blue': 'radial-gradient(circle, #0a1128 0%, #02040a 100%)',
    'aurora-purple': 'radial-gradient(circle, #1a0b2e 0%, #05020c 100%)',
    'charcoal-fade': 'linear-gradient(180deg, #141416 0%, #08080a 100%)'
};

function applyBackgroundTheme() {
    var bgLayer = document.getElementById('landscape-view');
    if (bgLayer) {
        bgLayer.style.background = gradientThemes[state.theme] || '#000000';
    }
}

// ========================================================
// TRUE LOCAL TIME SYSTEM FOR ASIA / SINGAPORE DOCK
// ========================================================
function updateClock() {
    var now = new Date();

    var timeOptions = {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    var timeString = now.toLocaleTimeString('en-US', timeOptions);

    var timeEl = document.getElementById('apple-time');
    if (timeEl) timeEl.textContent = timeString;

    var dateOptions = {
        timeZone: 'Asia/Singapore',
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    };
    var dateEl = document.getElementById('apple-date');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
}

// ========================================================
// POMODORO TIMER SYSTEM
// ========================================================
var pomoDuration = 1500;
var pomoTimer = null;
function initPomodoro() {
    var startBtn = document.getElementById('pomo-start-btn');
    var resetBtn = document.getElementById('pomo-reset-btn');
    var display = document.getElementById('pomo-time');

    if (!startBtn) return;

    startBtn.addEventListener('click', function () {
        if (pomoTimer) {
            clearInterval(pomoTimer);
            pomoTimer = null;
            startBtn.textContent = 'Start';
            startBtn.style.backgroundColor = '#30d158';
        } else {
            startBtn.textContent = 'Pause';
            startBtn.style.backgroundColor = '#ffcc00';
            pomoTimer = setInterval(function () {
                if (pomoDuration > 0) {
                    pomoDuration--;
                    var mins = Math.floor(pomoDuration / 60).toString();
                    var secs = (pomoDuration % 60).toString();
                    if (mins.length < 2) mins = '0' + mins;
                    if (secs.length < 2) secs = '0' + secs;
                    display.textContent = mins + ':' + secs;
                } else {
                    clearInterval(pomoTimer);
                    alert('Focus Session Completed!');
                }
            }, 1000);
        }
    });

    resetBtn.addEventListener('click', function () {
        clearInterval(pomoTimer);
        pomoTimer = null;
        pomoDuration = 1500;
        display.textContent = '25:00';
        startBtn.textContent = 'Start';
        startBtn.style.backgroundColor = '#30d158';
    });
}

// ========================================================
// LONG PRESS DETECTOR GESTURE
// ========================================================
function initLongPressGesture() {
    var view = document.getElementById('landscape-view');
    var modal = document.getElementById('edit-modal');
    var longPressTimer;

    if (!view) return;

    view.addEventListener('touchstart', function (e) {
        if (e.target.tagName === 'BUTTON') return; // Skip button clocks
        longPressTimer = setTimeout(function () {
            modal.style.display = 'flex';
            document.getElementById('theme-selector').value = state.theme;
        }, 800);
    });

    view.addEventListener('touchend', function () { clearTimeout(longPressTimer); });

    document.getElementById('save-settings-btn').addEventListener('click', function () {
        state.theme = document.getElementById('theme-selector').value;
        saveState();
        applyBackgroundTheme();
        modal.style.display = 'none';
    });

    document.getElementById('close-modal-btn').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

// ========================================================
// UNIFIED MIRO-STYLE FREEFORM INTERACTIVE DRAG ENGAGEMENT 
// ========================================================
var canvas = document.getElementById('canvas');

function renderFreeformCanvas() {
    if (!canvas) return;
    canvas.innerHTML = '';
    state.blocks.forEach(function (blockData) {
        createBlockElement(blockData);
    });
}

function createBlockElement(data) {
    var el = document.createElement('div');
    el.className = 'draggable-card type-' + data.type + (data.done ? ' done' : '');
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';

    var textarea = document.createElement('textarea');
    textarea.value = data.text;

    // Build structure depending on card context types
    if (data.type === 'note') {
        el.appendChild(textarea);
    } else {
        // Structural wrapper block definitions for Task items
        var mainContainer = document.createElement('div');
        mainContainer.className = 'todo-card-main';

        var checkbox = document.createElement('div');
        checkbox.className = 'todo-card-checkbox';

        checkbox.addEventListener('click', function () {
            data.done = !data.done;
            el.className = 'draggable-card type-todo' + (data.done ? ' done' : '');
            saveState();
        });

        textarea.className = 'todo-card-textarea';

        mainContainer.appendChild(checkbox);
        mainContainer.appendChild(textarea);
        el.appendChild(mainContainer);

        var footer = document.createElement('div');
        footer.className = 'todo-card-footer';
        footer.textContent = 'Action Item';
        el.appendChild(footer);
    }

    canvas.appendChild(el);

    // Sync content modifications directly into tracking arrays
    textarea.addEventListener('change', function (e) {
        var item = state.blocks.find(function (b) { return b.id === data.id; });
        if (item) {
            item.text = e.target.value;
            saveState();
        }
    });

    // Pure mathematical touch translation bypasses iOS scroll engine freezes
    var active = false;
    var currentX = data.x, currentY = data.y, initialX, initialY;
    var xOffset = data.x, yOffset = data.y;

    el.addEventListener('touchstart', function (e) {
        if (document.activeElement === textarea) return;
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
        active = true;
    }, false);

    el.addEventListener('touchend', function () {
        active = false;
        var item = state.blocks.find(function (b) { return b.id === data.id; });
        if (item) {
            item.x = currentX;
            item.y = currentY;
            saveState();
        }
    }, false);

    el.addEventListener('touchmove', function (e) {
        if (active) {
            e.preventDefault(); // Stop window bouncing
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            el.style.left = currentX + 'px';
            el.style.top = currentY + 'px';
        }
    }, false);
}

// Button Bindings for Workspace Elements
var addNoteBtn = document.getElementById('add-note-btn');
if (addNoteBtn) {
    addNoteBtn.addEventListener('click', function () {
        var block = { id: 'b_' + Date.now(), type: 'note', x: 60, y: 80, text: 'Sticky note text...' };
        state.blocks.push(block);
        saveState();
        createBlockElement(block);
    });
}

var addTodoBtn = document.getElementById('add-todo-btn');
if (addTodoBtn) {
    addTodoBtn.addEventListener('click', function () {
        var block = { id: 'b_' + Date.now(), type: 'todo', x: 100, y: 120, text: 'Task description...', done: false };
        state.blocks.push(block);
        saveState();
        createBlockElement(block);
    });
}

// INITIALIZATION INTEGRATION ROUTER
window.onload = function () {
    setInterval(updateClock, 1000);
    updateClock();
    applyBackgroundTheme();
    initPomodoro();
    initLongPressGesture();
    renderFreeformCanvas();
};
