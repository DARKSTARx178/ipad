// Kill document wrapper baseline elastic viewport dragging across the app structure
window.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

// ========================================================
// MEMORY STATE CONTROLLERS
// ========================================================
var state = {
    widgets: JSON.parse(localStorage.getItem('sb_widgets')) || [
        { id: 'w1', type: 'clock' },
        { id: 'w2', type: 'pomodoro' }
    ],
    blocks: JSON.parse(localStorage.getItem('sb_blocks')) || [
        { id: 'b1', type: 'note', x: 50, y: 80, text: 'Tap note card content directly' },
        { id: 'b2', type: 'todo', x: 260, y: 150, text: 'Wipe down work surface desk space', done: false }
    ]
};

function saveState() {
    localStorage.setItem('sb_widgets', JSON.stringify(state.widgets));
    localStorage.setItem('sb_blocks', JSON.stringify(state.blocks));
}

// Icons used for widgets rendered dynamically into the grid
var WIDGET_ICONS = {
    weather: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17.5 17.5H7a4 4 0 1 1 1.1-7.85A5 5 0 0 1 18 11a3.5 3.5 0 0 1-.5 6.5Z" stroke-linejoin="round"/></svg>',
    notes: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6z" stroke-linejoin="round"/><path d="M15 3v4h4M9 12h6M9 16h6" stroke-linecap="round"/></svg>',
    battery: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="17" height="8" rx="2" stroke-linejoin="round"/><path d="M21 10.5v3" stroke-linecap="round"/></svg>'
};

// ========================================================
// ORIENTATION A: LANDSCAPE METRIC SYSTEMS
// ========================================================
function renderDashboardGrid() {
    var grid = document.getElementById('grid-surface');
    if (!grid) return;
    grid.innerHTML = '';

    state.widgets.forEach(function (wData) {
        var slot = document.createElement('div');
        slot.className = 'widget-slot w-size-2x1';
        slot.id = 'slot-' + wData.id;

        if (wData.type === 'clock') {
            slot.innerHTML = '<div class="clock-wrapper"><div id="apple-time">00:00</div><div id="apple-date">LOADING...</div></div>';
        } else if (wData.type === 'pomodoro') {
            slot.innerHTML = '<div class="pomo-rotary-container"><div class="dial-outer-ring" id="rotary-ring"></div><div id="pomo-time">25:00</div><div class="pomo-icon-controls"><button class="icon-btn" id="pomo-play-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button><button class="icon-btn" id="pomo-reset-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v6h6M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9A7 7 0 0 1 19 9M18.5 15a7 7 0 0 1-13.5 0" stroke-linecap="round"/></svg></button></div></div>';
        } else if (wData.type === 'weather') {
            slot.className += ' compact';
            slot.innerHTML = '<div class="weather-wrapper">' + WIDGET_ICONS.weather + '<div class="weather-temp">--°</div><div class="weather-label">No data source</div></div>';
        } else if (wData.type === 'notes') {
            slot.className += ' compact';
            slot.innerHTML = '<div class="notes-wrapper">' + WIDGET_ICONS.notes + '<span>Switch to Portrait</span></div>';
        } else if (wData.type === 'battery') {
            slot.className += ' compact';
            slot.innerHTML = '<div class="battery-wrapper">' + WIDGET_ICONS.battery + '<div class="battery-pct">--%</div></div>';
        }
        grid.appendChild(slot);
    });

    // Re-bind mechanical listeners
    initClockEngine();
    initRotaryTimerEngine();
    initBatteryEngine();
}

// 1. Apple Bold Clock (no border ring)
function initClockEngine() {
    function tick() {
        var now = new Date();
        var timeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false });
        var dateStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore', weekday: 'long', month: 'short', day: 'numeric' });

        var timeEl = document.getElementById('apple-time');
        var dateEl = document.getElementById('apple-date');
        if (timeEl) timeEl.textContent = timeStr;
        if (dateEl) dateEl.textContent = dateStr;
    }
    setInterval(tick, 1000);
    tick();
}

// 2. Android Rotary Spin Dial Mechanics
var pomoDuration = 1500;
var pomoTimer = null;

function initRotaryTimerEngine() {
    var ring = document.getElementById('rotary-ring');
    var display = document.getElementById('pomo-time');
    var playBtn = document.getElementById('pomo-play-btn');
    var resetBtn = document.getElementById('pomo-reset-btn');

    if (!ring) return;

    var isSpinning = false;
    var startAngle = 0;

    ring.addEventListener('touchstart', function (e) {
        isSpinning = true;
        var t = e.touches[0];
        var rect = ring.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        startAngle = Math.atan2(t.clientY - cy, t.clientX - cx);
    });

    ring.addEventListener('touchmove', function (e) {
        if (!isSpinning) return;
        e.preventDefault();
        var t = e.touches[0];
        var rect = ring.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var currentAngle = Math.atan2(t.clientY - cy, t.clientX - cx);
        var delta = currentAngle - startAngle;

        if (Math.abs(delta) > 0.1) {
            pomoDuration += delta > 0 ? 60 : -60;
            if (pomoDuration < 60) pomoDuration = 60;
            if (pomoDuration > 5400) pomoDuration = 5400; // max 90m

            var m = Math.floor(pomoDuration / 60).toString();
            var s = (pomoDuration % 60).toString();
            if (m.length < 2) m = '0' + m;
            if (s.length < 2) s = '0' + s;
            display.textContent = m + ':' + s;
            startAngle = currentAngle;
        }
    });

    ring.addEventListener('touchend', function () { isSpinning = false; });

    if (playBtn) {
        playBtn.addEventListener('click', function () {
            if (pomoTimer) {
                clearInterval(pomoTimer);
                pomoTimer = null;
            } else {
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
                        pomoTimer = null;
                    }
                }, 1000);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            clearInterval(pomoTimer);
            pomoTimer = null;
            pomoDuration = 1500;
            display.textContent = '25:00';
        });
    }
}

// 3. Battery widget (uses navigator.getBattery where the browser supports it)
function initBatteryEngine() {
    var pctEl = document.querySelector('.battery-pct');
    if (!pctEl) return;

    if (navigator.getBattery) {
        navigator.getBattery().then(function (battery) {
            function update() {
                pctEl.textContent = Math.round(battery.level * 100) + '%';
            }
            update();
            battery.addEventListener('levelchange', update);
        });
    }
}

// 4. Apple Widget Gallery Sheet Gestures
function initDrawerMechanics() {
    var surface = document.getElementById('landscape-view');
    var drawer = document.getElementById('widget-drawer');
    var holdTimer;

    if (!surface) return;

    surface.addEventListener('touchstart', function (e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('#rotary-ring')) return;
        holdTimer = setTimeout(function () { drawer.className = 'drawer-panel open'; }, 700);
    });
    surface.addEventListener('touchend', function () { clearTimeout(holdTimer); });

    // Close drawer if clicking outside
    surface.addEventListener('click', function (e) {
        if (!e.target.closest('#widget-drawer')) { drawer.className = 'drawer-panel'; }
    });

    var cards = document.querySelectorAll('.drawer-item-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function () {
            var type = this.getAttribute('data-widget');
            if (state.widgets.length < 8) {
                state.widgets.push({ id: 'w_' + Date.now(), type: type });
                saveState();
                renderDashboardGrid();
            }
            drawer.className = 'drawer-panel';
        });
    }
}

// ========================================================
// ORIENTATION B: PORTRAIT PLANNER MECHANICS
// ========================================================
var canvas = document.getElementById('canvas');
var trashBin = document.getElementById('trash-bin');

function renderFreeformCanvas() {
    if (!canvas) return;
    canvas.innerHTML = '';
    state.blocks.forEach(function (bData) { createBlockNode(bData); });
}

function createBlockNode(data) {
    var el = document.createElement('div');
    el.className = 'draggable-card type-' + data.type + (data.done ? ' done' : '');
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';

    var textarea = document.createElement('textarea');
    textarea.value = data.text;

    if (data.type === 'note') {
        el.appendChild(textarea);
    } else {
        var box = document.createElement('div');
        box.className = 'todo-card-checkbox';
        box.addEventListener('click', function () {
            data.done = !data.done;
            el.className = 'draggable-card type-todo' + (data.done ? ' done' : '');
            saveState();
        });
        textarea.className = 'todo-card-textarea';
        el.appendChild(box);
        el.appendChild(textarea);
    }
    canvas.appendChild(el);

    textarea.addEventListener('change', function (e) {
        var item = state.blocks.find(function (b) { return b.id === data.id; });
        if (item) { item.text = e.target.value; saveState(); }
    });

    // Drag tracking + trash overlap detection
    var active = false;
    var currentX = data.x, currentY = data.y, initialX, initialY;
    var xOffset = data.x, yOffset = data.y;

    el.addEventListener('touchstart', function (e) {
        if (document.activeElement === textarea) return;
        var touch = e.touches[0];
        initialX = touch.clientX - xOffset;
        initialY = touch.clientY - yOffset;
        active = true;
    }, false);

    el.addEventListener('touchend', function () {
        active = false;
        // Check trash collision
        var tRect = trashBin.getBoundingClientRect();
        if (currentX + 85 > tRect.left && currentX < tRect.right && currentY + 85 > tRect.top) {
            state.blocks = state.blocks.filter(function (b) { return b.id !== data.id; });
            saveState();
            el.parentNode.removeChild(el);
            trashBin.style.transform = 'scale(1)';
            return;
        }
        var item = state.blocks.find(function (b) { return b.id === data.id; });
        if (item) { item.x = currentX; item.y = currentY; saveState(); }
    }, false);

    el.addEventListener('touchmove', function (e) {
        if (active) {
            e.preventDefault();
            var touch = e.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            el.style.left = currentX + 'px';
            el.style.top = currentY + 'px';

            // Trash proximity pulse
            var tRect = trashBin.getBoundingClientRect();
            if (currentX + 85 > tRect.left && currentY + 85 > tRect.top) {
                trashBin.style.transform = 'scale(1.25)';
            } else {
                trashBin.style.transform = 'scale(1)';
            }
        }
    }, false);
}

// Corner Action FAB: opens an anchored popup beside the button with a scale/fade transition
function initFABController() {
    var trigger = document.getElementById('fab-trigger');
    var popup = document.getElementById('fab-popup');
    if (!trigger) return;

    var isOpen = false;

    function closePopup() {
        isOpen = false;
        popup.className = 'fab-popup';
        trigger.className = 'action-fab';
    }

    function openPopup() {
        isOpen = true;
        popup.className = 'fab-popup open';
        trigger.className = 'action-fab active';
    }

    trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOpen) { closePopup(); } else { openPopup(); }
    });

    document.addEventListener('click', function (e) {
        if (isOpen && !e.target.closest('#fab-popup') && !e.target.closest('#fab-trigger')) {
            closePopup();
        }
    });

    document.getElementById('fab-add-note').addEventListener('click', function () {
        var block = { id: 'b_' + Date.now(), type: 'note', x: 60, y: 100, text: 'New Note card...' };
        state.blocks.push(block);
        saveState();
        createBlockNode(block);
        closePopup();
    });

    document.getElementById('fab-add-todo').addEventListener('click', function () {
        var block = { id: 'b_' + Date.now(), type: 'todo', x: 90, y: 140, text: 'Task checkbox text...', done: false };
        state.blocks.push(block);
        saveState();
        createBlockNode(block);
        closePopup();
    });
}

// ========================================================
// INITIALIZATION BOOT MANAGER
// ========================================================
window.onload = function () {
    renderDashboardGrid();
    initDrawerMechanics();
    renderFreeformCanvas();
    initFABController();
};