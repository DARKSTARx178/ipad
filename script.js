// ========================================================
// CORE SAVED APPLICATION STATE DOCK
// ========================================================
var state = {
    playlistName: localStorage.getItem('g_playlistName') || 'lofi chill',
    artworkUrl: localStorage.getItem('g_artworkUrl') || 'https://unsplash.com',
    todos: JSON.parse(localStorage.getItem('g_todos')) || [
        { id: 't1', text: 'Plan morning layout routines', done: false },
        { id: 't2', text: 'Clean coffee equipment', done: true }
    ],
    notes: JSON.parse(localStorage.getItem('g_notes')) || [
        { id: 'n1', x: 30, y: 50, text: 'Brainstorm workspace adjustments' }
    ]
};

function saveState() {
    localStorage.setItem('g_playlistName', state.playlistName);
    localStorage.setItem('g_artworkUrl', state.artworkUrl);
    localStorage.setItem('g_todos', JSON.stringify(state.todos));
    localStorage.setItem('g_notes', JSON.stringify(state.notes));
}

// ========================================================
// SINGAPORE ORIENTED PRECISION CLOCK LOGIC
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
// SAFE DYNAMIC MOCK PLAYER CONTROLLER (Bypasses iPad Popups)
// ========================================================
function loadMockPlayer() {
    var titleEl = document.getElementById('playlist-title');
    var artEl = document.getElementById('playlist-art');
    if (titleEl) titleEl.textContent = state.playlistName;
    if (artEl) artEl.src = state.artworkUrl;
}

// ========================================================
// POMODORO MECHANICAL COUNTDOWN CORE
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
            startBtn.style.backgroundColor = '#34c759';
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
        startBtn.style.backgroundColor = '#34c759';
    });
}

// ========================================================
// GRIDFINITY PRESS-AND-HOLD MANAGER SHEET GESTURE
// ========================================================
function initEditGestures() {
    var grid = document.querySelector('.gridfinity-container');
    var modal = document.getElementById('edit-modal');
    var longPressTimer;

    if (!grid) return;

    grid.addEventListener('touchstart', function () {
        longPressTimer = setTimeout(function () {
            modal.style.display = 'flex';
            document.getElementById('playlist-name-input').value = state.playlistName;
            document.getElementById('artwork-url-input').value = state.artworkUrl;
        }, 800);
    });

    grid.addEventListener('touchend', function () { clearTimeout(longPressTimer); });

    document.getElementById('save-settings-btn').addEventListener('click', function () {
        state.playlistName = document.getElementById('playlist-name-input').value;
        state.artworkUrl = document.getElementById('artwork-url-input').value;
        saveState();
        loadMockPlayer();
        modal.style.display = 'none';
    });

    document.getElementById('close-modal-btn').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

// ========================================================
// FIXED PLANNER LIST IMPLEMENTATIONS
// ========================================================
function renderTodos() {
    var list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    state.todos.forEach(function (todo, idx) {
        var li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        var box = document.createElement('div');
        box.className = 'todo-checkbox';
        box.addEventListener('click', function () {
            state.todos[idx].done = !state.todos[idx].done;
            saveState();
            renderTodos();
        });

        var input = document.createElement('input');
        input.value = todo.text;
        input.addEventListener('change', function (e) {
            state.todos[idx].text = e.target.value;
            saveState();
        });

        li.appendChild(box);
        li.appendChild(input);
        list.appendChild(li);
    });
}

var addTodoBtn = document.getElementById('add-todo-btn');
if (addTodoBtn) {
    addTodoBtn.addEventListener('click', function () {
        state.todos.push({ id: 't_' + Date.now(), text: 'New Task...', done: false });
        saveState();
        renderTodos();
    });
}

// ========================================================
// RE-BOUND INTERACTIVE DRAG STICKY NOTES LOGIC
// ========================================================
var canvas = document.getElementById('canvas');

function renderNotes() {
    if (!canvas) return;
    canvas.innerHTML = '';
    state.notes.forEach(function (noteData) { createNoteElement(noteData); });
}

function createNoteElement(data) {
    var note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.left = data.x + 'px';
    note.style.top = data.y + 'px';

    var textarea = document.createElement('textarea');
    textarea.value = data.text;
    note.appendChild(textarea);
    canvas.appendChild(note);

    textarea.addEventListener('change', function (e) {
        var target = state.notes.find(function (n) { return n.id === data.id; });
        if (target) { target.text = e.target.value; saveState(); }
    });

    var active = false;
    var currentX = data.x, currentY = data.y, initialX, initialY;
    var xOffset = data.x, yOffset = data.y;

    note.addEventListener('touchstart', function (e) {
        if (document.activeElement === textarea) return;
        initialX = e.touches.clientX - xOffset;
        initialY = e.touches.clientY - yOffset;
        active = true;
    }, false);

    note.addEventListener('touchend', function () {
        active = false;
        var target = state.notes.find(function (n) { return n.id === data.id; });
        if (target) { target.x = currentX; target.y = currentY; saveState(); }
    }, false);

    note.addEventListener('touchmove', function (e) {
        if (active) {
            e.preventDefault();
            currentX = e.touches.clientX - initialX;
            currentY = e.touches.clientY - initialY;
            xOffset = currentX; yOffset = currentY;
            note.style.left = currentX + 'px';
            note.style.top = currentY + 'px';
        }
    }, false);
}

var addNoteBtn = document.getElementById('add-note-btn');
if (addNoteBtn) {
    addNoteBtn.addEventListener('click', function () {
        var newNote = { id: 'n_' + Date.now(), x: 60, y: 80, text: 'Write notes here...' };
        state.notes.push(newNote);
        saveState();
        createNoteElement(newNote);
    });
}

// INITIALIZATION DRIVER
window.onload = function () {
    setInterval(updateClock, 1000);
    updateClock();
    loadMockPlayer();
    initPomodoro();
    initEditGestures();
    renderTodos();
    renderNotes();
};
