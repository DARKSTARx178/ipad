// Kill document wrapper baseline elastic viewport dragging across the app structure
window.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

// ========================================================
// CONFIG
// ========================================================
var OWM_API_KEY = 'ed8e61af30682533f8846012e1ec66ee';
var OWM_CITY = 'Singapore,SG';
var OWM_UNITS = 'metric';

// ========================================================
// LANDSCAPE GRID CONFIG — 4 cols x 2 rows = 8 exact slots
// ========================================================
var GRID_COLS = 4;
var GRID_ROWS = 2;
var PAD = 16;
var GAP = 16;
var SLOT_W = 236;
var SLOT_H = 360;

function slotRect(slotIndex, span) {
    var col = slotIndex % GRID_COLS;
    var row = Math.floor(slotIndex / GRID_COLS);
    return {
        left: PAD + col * (SLOT_W + GAP),
        top: PAD + row * (SLOT_H + GAP),
        width: SLOT_W * span + GAP * (span - 1),
        height: SLOT_H
    };
}

function pointToSlot(x, y) {
    var col = Math.round((x - PAD - SLOT_W / 2) / (SLOT_W + GAP));
    var row = Math.round((y - PAD - SLOT_H / 2) / (SLOT_H + GAP));
    col = Math.max(0, Math.min(GRID_COLS - 1, col));
    row = Math.max(0, Math.min(GRID_ROWS - 1, row));
    return row * GRID_COLS + col;
}

function isOccupied(slotIndex, excludeId) {
    for (var i = 0; i < state.widgets.length; i++) {
        var w = state.widgets[i];
        if (w.id === excludeId) continue;
        for (var k = 0; k < w.span; k++) {
            if (w.slot + k === slotIndex) return true;
        }
    }
    return false;
}

function findFreeSlot(span) {
    for (var s = 0; s < GRID_COLS * GRID_ROWS; s++) {
        var col = s % GRID_COLS;
        if (col + span > GRID_COLS) continue;
        var ok = true;
        for (var k = 0; k < span; k++) {
            if (isOccupied(s + k, null)) { ok = false; break; }
        }
        if (ok) return s;
    }
    return -1;
}

// ========================================================
// MEMORY STATE CONTROLLERS
// New storage key (v4) so nobody's leftover cached widget data from an
// earlier version (clock/pomodoro/notes/battery) can carry over and
// reference widget types that no longer exist.
// ========================================================
var state = {
    widgets: [],
    blocks: []
};

(function loadState() {
    try {
        var savedWidgets = JSON.parse(localStorage.getItem('sb_widgets_v4'));
        if (savedWidgets && savedWidgets.length) {
            state.widgets = savedWidgets;
        }
    } catch (err) {
        state.widgets = [];
    }
    if (!state.widgets || !state.widgets.length) {
        state.widgets = [
            { id: 'w1', type: 'clock', span: 2, slot: 0 },
            { id: 'w2', type: 'weather', span: 1, slot: 2 },
            { id: 'w3', type: 'pet', span: 1, slot: 3 },
            { id: 'w4', type: 'timer', span: 2, slot: 4 }
        ];
    }

    try {
        var savedBlocks = JSON.parse(localStorage.getItem('sb_blocks'));
        if (savedBlocks && savedBlocks.length) {
            state.blocks = savedBlocks;
        }
    } catch (err) {
        state.blocks = [];
    }
    if (!state.blocks || !state.blocks.length) {
        state.blocks = [
            { id: 'b1', type: 'note', x: 50, y: 80, text: 'Tap note card content directly' },
            { id: 'b2', type: 'todo', x: 260, y: 150, text: 'Wipe down work surface desk space', done: false }
        ];
    }
})();

function saveState() {
    try {
        localStorage.setItem('sb_widgets_v4', JSON.stringify(state.widgets));
        localStorage.setItem('sb_blocks', JSON.stringify(state.blocks));
    } catch (err) {
        // Storage can fail (private mode, quota); never let that break the app.
    }
}

var WIDGET_ICONS = {
    weather: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17.5 17.5H7a4 4 0 1 1 1.1-7.85A5 5 0 0 1 18 11a3.5 3.5 0 0 1-.5 6.5Z" stroke-linejoin="round"/></svg>',
    pet: '<div class="tama-pixel-body"><div class="tama-row"><i></i><i></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div><div class="tama-row"><i></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div><div class="tama-row"><i class="on"></i><i class="on"></i><i class="eye"></i><i class="on"></i><i class="on"></i><i class="eye"></i><i class="on"></i><i class="on"></i></div><div class="tama-row"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div><div class="tama-row"><i></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div><div class="tama-row"><i></i><i></i><i class="on"></i><i></i><i></i><i class="on"></i><i></i><i></i></div></div>',
    timer: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6" stroke-linecap="round"/></svg>'
};

var ICON_PLAY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
var ICON_RESET = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v6h6M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9A7 7 0 0 1 19 9M18.5 15a7 7 0 0 1-13.5 0" stroke-linecap="round"/></svg>';

// ========================================================
// SAFE-RUN HELPER — never let one broken widget blank the whole screen.
// Every widget "init" function is wrapped in try/catch through this.
// ========================================================
function safeRun(fn, label) {
    try {
        fn();
    } catch (err) {
        // Swallow and continue; the rest of the dashboard keeps working.
    }
}

// ========================================================
// ORIENTATION A: LANDSCAPE SLOT GRID
// ========================================================
var jiggleMode = false;
var dragCtx = null;

function renderDashboardGrid() {
    safeRun(function () {
        var grid = document.getElementById('grid-surface');
        if (!grid) return;
        grid.innerHTML = '';

        state.widgets.forEach(function (wData) {
            var rect = slotRect(wData.slot, wData.span);
            var slot = document.createElement('div');
            slot.className = 'widget-slot' + (jiggleMode ? ' jiggle' : '');
            slot.id = 'slot-' + wData.id;
            slot.style.left = rect.left + 'px';
            slot.style.top = rect.top + 'px';
            slot.style.width = rect.width + 'px';
            slot.style.height = rect.height + 'px';

            if (wData.type === 'clock') {
                slot.innerHTML = '<div class="clock-wrapper"><div id="apple-time">--:--</div><div id="apple-date">LOADING...</div></div>';
            } else if (wData.type === 'weather') {
                slot.innerHTML = '<div class="weather-wrapper" id="weather-box">' + WIDGET_ICONS.weather + '<div class="weather-temp" id="weather-temp">--°</div><div class="weather-label" id="weather-label">Loading...</div></div>';
            } else if (wData.type === 'pet') {
                slot.innerHTML = '<div class="pet-wrapper"><div class="tama-shell"><div class="pet-scene"><div class="pet-sprite" id="pet-sprite-' + wData.id + '">' + WIDGET_ICONS.pet + '</div></div></div><div class="pet-label" id="pet-label-' + wData.id + '">idle</div></div>';
            } else if (wData.type === 'timer') {
                slot.innerHTML = '<div class="simple-timer-wrapper"><div id="timer-display-' + wData.id + '">05:00</div><div class="timer-controls"><button class="icon-btn" data-timer-id="' + wData.id + '" data-action="start">' + ICON_PLAY + '</button><button class="icon-btn" data-timer-id="' + wData.id + '" data-action="reset">' + ICON_RESET + '</button></div></div>';
            }

            if (jiggleMode) {
                var badge = document.createElement('div');
                badge.className = 'widget-delete-badge';
                badge.innerHTML = '&#10005;';
                badge.addEventListener('touchend', function (e) {
                    e.stopPropagation();
                    state.widgets = state.widgets.filter(function (w) { return w.id !== wData.id; });
                    saveState();
                    renderDashboardGrid();
                });
                slot.appendChild(badge);
            }

            grid.appendChild(slot);
            bindWidgetDrag(slot, wData);
        });
    });

    safeRun(initClockEngine);
    safeRun(initWeatherEngine);
    safeRun(initPetEngines);
    safeRun(initSimpleTimers);
}

function enterJiggleMode() {
    if (jiggleMode) return;
    jiggleMode = true;
    renderDashboardGrid();
}

function exitJiggleMode() {
    if (!jiggleMode) return;
    jiggleMode = false;
    renderDashboardGrid();
}

function bindWidgetDrag(el, wData) {
    var holdTimer;

    el.addEventListener('touchstart', function (e) {
        if (e.target.closest('.widget-delete-badge') || e.target.tagName === 'BUTTON') return;
        var touch = e.touches[0];

        if (jiggleMode) {
            dragCtx = {
                id: wData.id,
                startX: touch.clientX,
                startY: touch.clientY,
                origLeft: parseFloat(el.style.left),
                origTop: parseFloat(el.style.top)
            };
        } else {
            holdTimer = setTimeout(function () { enterJiggleMode(); }, 550);
        }
    });

    el.addEventListener('touchmove', function (e) {
        clearTimeout(holdTimer);
        if (dragCtx && dragCtx.id === wData.id) {
            e.preventDefault();
            var touch = e.touches[0];
            var dx = touch.clientX - dragCtx.startX;
            var dy = touch.clientY - dragCtx.startY;
            el.style.left = (dragCtx.origLeft + dx) + 'px';
            el.style.top = (dragCtx.origTop + dy) + 'px';
            el.style.zIndex = 50;
        }
    });

    el.addEventListener('touchend', function () {
        clearTimeout(holdTimer);
        if (dragCtx && dragCtx.id === wData.id) {
            finishWidgetDrag(el, wData);
        }
    });
}

function finishWidgetDrag(el, wData) {
    var grid = document.getElementById('grid-surface');
    var gridRect = grid.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var centerX = (elRect.left - gridRect.left) + elRect.width / 2;
    var centerY = (elRect.top - gridRect.top) + elRect.height / 2;
    var targetSlot = pointToSlot(centerX, centerY);

    var occupant = null;
    for (var i = 0; i < state.widgets.length; i++) {
        var w = state.widgets[i];
        if (w.id === wData.id) continue;
        for (var k = 0; k < w.span; k++) {
            if (w.slot + k === targetSlot) { occupant = w; break; }
        }
        if (occupant) break;
    }

    if (occupant) {
        var tmp = occupant.slot;
        occupant.slot = wData.slot;
        wData.slot = tmp;
    } else {
        var col = targetSlot % GRID_COLS;
        if (col + wData.span <= GRID_COLS) {
            wData.slot = targetSlot;
        }
    }

    dragCtx = null;
    saveState();
    renderDashboardGrid();
}

// 1. Clock — hour, minute, AM/PM only, no seconds, no timezone label
function initClockEngine() {
    var timeEl = document.getElementById('apple-time');
    if (!timeEl) return;

    function tick() {
        safeRun(function () {
            var now = new Date();
            var timeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/[^0-9:]/g, '');
            var dateStr = now.toLocaleDateString('en-US', { timeZone: 'Asia/Singapore', weekday: 'long', month: 'short', day: 'numeric' });
            var t = document.getElementById('apple-time');
            var d = document.getElementById('apple-date');
            if (t) t.textContent = timeStr;
            if (d) d.textContent = dateStr;
        });
    }
    if (window.__clockInterval) clearInterval(window.__clockInterval);
    window.__clockInterval = setInterval(tick, 1000);
    tick();
}

// 2. Weather — live OpenWeatherMap fetch. Every failure path is caught
//    so a network error, bad key, or slow response can never stall or
//    blank the rest of the dashboard.
function initWeatherEngine() {
    var tempEl = document.getElementById('weather-temp');
    var labelEl = document.getElementById('weather-label');
    if (!tempEl || !labelEl) return;

    if (!OWM_API_KEY) {
        labelEl.textContent = 'No API key';
        return;
    }

    var url = 'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(OWM_CITY) + '&units=' + OWM_UNITS + '&appid=' + OWM_API_KEY;

    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;

        xhr.onreadystatechange = function () {
            safeRun(function () {
                if (xhr.readyState !== 4) return;
                var t = document.getElementById('weather-temp');
                var l = document.getElementById('weather-label');
                if (!t || !l) return;

                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    if (data && data.main) {
                        t.textContent = Math.round(data.main.temp) + '°';
                        l.textContent = (data.weather && data.weather[0] && data.weather[0].main) ? data.weather[0].main : '';
                    } else {
                        l.textContent = 'Unavailable';
                    }
                } else if (xhr.status === 401) {
                    l.textContent = 'Key not active yet';
                } else {
                    l.textContent = 'Unavailable';
                }
            });
        };

        xhr.onerror = function () {
            safeRun(function () {
                var l = document.getElementById('weather-label');
                if (l) l.textContent = 'Offline';
            });
        };
        xhr.ontimeout = function () {
            safeRun(function () {
                var l = document.getElementById('weather-label');
                if (l) l.textContent = 'Timed out';
            });
        };

        xhr.send();
    } catch (err) {
        labelEl.textContent = 'Unavailable';
    }
}

// 3. Pet widget(s) — VS Code Pets style idle companion, no server needed.
//    Supports more than one pet widget on the grid at once.
var petIntervals = {};

function initPetEngines() {
    state.widgets.forEach(function (wData) {
        if (wData.type !== 'pet') return;
        var sprite = document.getElementById('pet-sprite-' + wData.id);
        var label = document.getElementById('pet-label-' + wData.id);
        if (!sprite) return;

        if (petIntervals[wData.id]) clearInterval(petIntervals[wData.id]);

        var localState = { x: 0, dir: 1 };
        var moods = ['idle', 'walking', 'stretching', 'napping'];

        petIntervals[wData.id] = setInterval(function () {
            safeRun(function () {
                var s = document.getElementById('pet-sprite-' + wData.id);
                var l = document.getElementById('pet-label-' + wData.id);
                if (!s) { clearInterval(petIntervals[wData.id]); return; }
                if (s.classList.contains('held')) return;

                var mood;
                var roll = Math.random();
                if (roll < 0.55) {
                    mood = 'walking';
                    localState.x += localState.dir * 3;
                    if (localState.x > 12) { localState.dir = -1; }
                    if (localState.x < -12) { localState.dir = 1; }
                } else {
                    mood = moods[Math.floor(Math.random() * moods.length)];
                }
                s.style.transform = 'translateX(' + localState.x + 'px) scaleX(' + localState.dir + ')';
                s.className = 'pet-sprite mood-' + mood;
                if (l) l.textContent = mood;
            });
        }, 1400);

        sprite.addEventListener('touchstart', function (e) {
            e.stopPropagation();
            sprite.classList.add('held');
            var l = document.getElementById('pet-label-' + wData.id);
            if (l) l.textContent = 'held!';
        });
        sprite.addEventListener('touchend', function (e) {
            e.stopPropagation();
            sprite.classList.remove('held');
        });
    });
}

// 4. Simple countdown timer — plain digits + start/pause/reset, no drag
//    gestures or angle math, so there is nothing that can misfire during
//    layout/centering changes.
var timerData = {};

function getTimerState(id) {
    if (!timerData[id]) {
        timerData[id] = { remaining: 300, running: false, interval: null };
    }
    return timerData[id];
}

function formatMMSS(totalSeconds) {
    var m = Math.floor(totalSeconds / 60).toString();
    var s = (totalSeconds % 60).toString();
    if (m.length < 2) m = '0' + m;
    if (s.length < 2) s = '0' + s;
    return m + ':' + s;
}

function initSimpleTimers() {
    var buttons = document.querySelectorAll('[data-timer-id]');
    for (var i = 0; i < buttons.length; i++) {
        bindTimerButton(buttons[i]);
    }
}

function bindTimerButton(btn) {
    btn.addEventListener('touchend', function (e) {
        e.stopPropagation();
        safeRun(function () {
            var id = btn.getAttribute('data-timer-id');
            var action = btn.getAttribute('data-action');
            var ts = getTimerState(id);
            var displayEl = document.getElementById('timer-display-' + id);

            if (action === 'reset') {
                clearInterval(ts.interval);
                ts.interval = null;
                ts.running = false;
                ts.remaining = 300;
                if (displayEl) displayEl.textContent = formatMMSS(ts.remaining);
                var playBtn = document.querySelector('[data-timer-id="' + id + '"][data-action="start"]');
                if (playBtn) playBtn.innerHTML = ICON_PLAY;
                return;
            }

            if (action === 'start') {
                if (ts.running) {
                    clearInterval(ts.interval);
                    ts.interval = null;
                    ts.running = false;
                    btn.innerHTML = ICON_PLAY;
                } else {
                    ts.running = true;
                    btn.innerHTML = ICON_PAUSE;
                    ts.interval = setInterval(function () {
                        safeRun(function () {
                            if (ts.remaining > 0) {
                                ts.remaining--;
                                var d = document.getElementById('timer-display-' + id);
                                if (d) d.textContent = formatMMSS(ts.remaining);
                            } else {
                                clearInterval(ts.interval);
                                ts.interval = null;
                                ts.running = false;
                                btn.innerHTML = ICON_PLAY;
                            }
                        });
                    }, 1000);
                }
            }
        });
    });
}

// 5. Long-press empty background to open the Add Widget drawer
function initDrawerMechanics() {
    var surface = document.getElementById('landscape-view');
    var drawer = document.getElementById('widget-drawer');
    var holdTimer;

    if (!surface || !drawer) return;

    surface.addEventListener('touchstart', function (e) {
        if (jiggleMode) return;
        if (e.target.closest('.widget-slot') || e.target.closest('#widget-drawer')) return;
        holdTimer = setTimeout(function () { drawer.className = 'drawer-panel open'; }, 700);
    });
    surface.addEventListener('touchmove', function () { clearTimeout(holdTimer); });
    surface.addEventListener('touchend', function () { clearTimeout(holdTimer); });

    surface.addEventListener('click', function (e) {
        if (jiggleMode) {
            if (!e.target.closest('.widget-slot')) { exitJiggleMode(); }
            return;
        }
        if (!e.target.closest('#widget-drawer')) { drawer.className = 'drawer-panel'; }
    });

    var addLock = false;
    function addWidgetFromCard(card) {
        if (addLock) return;
        addLock = true;
        setTimeout(function () { addLock = false; }, 400);

        var type = card.getAttribute('data-widget');
        var span = (type === 'clock' || type === 'timer') ? 2 : 1;
        var freeSlot = findFreeSlot(span);
        if (freeSlot !== -1) {
            state.widgets.push({ id: 'w_' + Date.now(), type: type, span: span, slot: freeSlot });
            saveState();
            renderDashboardGrid();
        }
        drawer.className = 'drawer-panel';
    }

    var cards = document.querySelectorAll('.drawer-item-card');
    for (var i = 0; i < cards.length; i++) {
        (function (card) {
            card.addEventListener('touchend', function (e) {
                e.stopPropagation();
                addWidgetFromCard(card);
            });
            card.addEventListener('click', function (e) {
                e.stopPropagation();
                addWidgetFromCard(card);
            });
        })(cards[i]);
    }
}

// ========================================================
// ORIENTATION B: PORTRAIT PLANNER MECHANICS
// (Sticky notes + to-do only — the "Switch to Portrait" notes widget
// and the landscape notes shortcut have both been removed.)
// ========================================================
var canvas = document.getElementById('canvas');
var trashBin = document.getElementById('trash-bin');

function renderFreeformCanvas() {
    safeRun(function () {
        if (!canvas) return;
        canvas.innerHTML = '';
        state.blocks.forEach(function (bData) { createBlockNode(bData); });
    });
}

function createBlockNode(data) {
    var el = document.createElement('div');
    el.className = 'draggable-card type-' + data.type + (data.done ? ' done' : '');
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';

    var handle = document.createElement('div');
    handle.className = 'card-handle';
    el.appendChild(handle);

    var body = document.createElement('div');
    body.className = 'card-body';

    var textarea = document.createElement('textarea');
    textarea.value = data.text;

    if (data.type === 'note') {
        body.appendChild(textarea);
    } else {
        body.className += ' todo-body';
        var box = document.createElement('div');
        box.className = 'todo-card-checkbox';
        box.addEventListener('touchend', function (e) {
            e.stopPropagation();
            data.done = !data.done;
            el.className = 'draggable-card type-todo' + (data.done ? ' done' : '');
            saveState();
        });
        textarea.className = 'todo-card-textarea';
        body.appendChild(box);
        body.appendChild(textarea);
    }
    el.appendChild(body);
    canvas.appendChild(el);

    textarea.addEventListener('change', function (e) {
        var item = state.blocks.find(function (b) { return b.id === data.id; });
        if (item) { item.text = e.target.value; saveState(); }
    });

    var active = false;
    var currentX = data.x, currentY = data.y, initialX, initialY;
    var xOffset = data.x, yOffset = data.y;

    handle.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        initialX = touch.clientX - xOffset;
        initialY = touch.clientY - yOffset;
        active = true;
    }, false);

    handle.addEventListener('touchend', function () {
        active = false;
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

    handle.addEventListener('touchmove', function (e) {
        if (active) {
            e.preventDefault();
            var touch = e.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            el.style.left = currentX + 'px';
            el.style.top = currentY + 'px';

            var tRect = trashBin.getBoundingClientRect();
            if (currentX + 85 > tRect.left && currentY + 85 > tRect.top) {
                trashBin.style.transform = 'scale(1.25)';
            } else {
                trashBin.style.transform = 'scale(1)';
            }
        }
    }, false);
}

function initFABController() {
    var trigger = document.getElementById('fab-trigger');
    var popup = document.getElementById('fab-popup');
    if (!trigger || !popup) return;

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

    var addNoteBtn = document.getElementById('fab-add-note');
    var addTodoBtn = document.getElementById('fab-add-todo');

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function () {
            var block = { id: 'b_' + Date.now(), type: 'note', x: 60, y: 100, text: 'New Note card...' };
            state.blocks.push(block);
            saveState();
            createBlockNode(block);
            closePopup();
        });
    }

    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', function () {
            var block = { id: 'b_' + Date.now(), type: 'todo', x: 90, y: 140, text: 'Task checkbox text...', done: false };
            state.blocks.push(block);
            saveState();
            createBlockNode(block);
            closePopup();
        });
    }
}

// ========================================================
// INITIALIZATION BOOT MANAGER
// Every step wrapped so one failure can never blank the whole page.
// ========================================================
window.onload = function () {
    safeRun(renderDashboardGrid);
    safeRun(initDrawerMechanics);
    safeRun(renderFreeformCanvas);
    safeRun(initFABController);
};