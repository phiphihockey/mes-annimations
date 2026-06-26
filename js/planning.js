const PLANNING_STORAGE_KEY = 'acm_planning_events';
const PLANNING_VIEW_KEY = 'acm_planning_week';
const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const HOUR_START = 8;
const HOUR_END = 20;
const SLOT_HEIGHT = 72;

let activities = [];
let planningEvents = [];
let currentWeekStart = getStartOfWeek(new Date());
let viewMode = 'week'; // 'week' or 'day'
let currentDay = new Date();
let touchMode = false;
let selectedActivityId = null;


function getStartOfWeek(date) {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setDate(clone.getDate() + diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  const withYear = arguments.length > 1 && arguments[1] === true;
  const options = withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' };
  return date.toLocaleDateString('fr-FR', options);
}

function loadPlanning() {
  const stored = localStorage.getItem(PLANNING_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) planningEvents = parsed;
    } catch (e) {}
  }

  const storedWeek = localStorage.getItem(PLANNING_VIEW_KEY);
  if (storedWeek) {
    const parsed = new Date(storedWeek);
    if (!Number.isNaN(parsed.getTime())) currentWeekStart = getStartOfWeek(parsed);
  }
}

function savePlanning() {
  localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(planningEvents));
}

function saveView() {
  localStorage.setItem(PLANNING_VIEW_KEY, currentWeekStart.toISOString());
}

function getPlanningForWeek() {
  const weekKey = toDateKey(currentWeekStart);
  return planningEvents.filter(event => {
    const eventDate = new Date(event.date);
    return toDateKey(eventDate) >= weekKey && toDateKey(eventDate) <= toDateKey(addDays(currentWeekStart, 6));
  });
}

function addDays(date, amount) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

function createEventFromActivity(activity, date, startHour) {
  return {
    id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    activityId: activity.id,
    title: activity.title,
    date,
    startHour,
    duration: activity.duration || '1h',
    theme: activity.theme || 'Autre',
    color: activity.theme ? getActivityThemeColor(activity.theme) : '#4b7bff'
  };
}

function parseDurationMinutes(duration) {
  if (!duration) return 60;
  const s = String(duration).trim().toLowerCase();
  if (s.includes('jour')) return 8 * 60;
  // 1h20, 1h 20, 1h30
  const hMatch = s.match(/^(\d+)\s*h(?:\s*(\d+))?$/);
  if (hMatch) {
    const h = Number(hMatch[1]);
    const m = hMatch[2] ? Number(hMatch[2]) : 0;
    return h * 60 + m;
  }
  // minutes: 30min or 30m
  const mMatch = s.match(/^(\d+)\s*(?:min|m)$/);
  if (mMatch) return Number(mMatch[1]);
  // plain number -> hours
  const numMatch = s.match(/^(\d+)$/);
  if (numMatch) return Number(numMatch[1]) * 60;
  return 60;
}

function formatTimeLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function renderActivityPool() {
  const pool = document.getElementById('activityPool');
  pool.innerHTML = '';

  activities.forEach(activity => {
    const card = document.createElement('div');
    card.className = 'planning-activity-card';
    card.draggable = true;
    card.dataset.activityId = activity.id;
    card.innerHTML = `
      <strong>${activity.title}</strong>
      <span>${activity.duration || '1h'} • ${activity.theme || 'Autre'}</span>
    `;
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', JSON.stringify({ activityId: activity.id }));
      event.dataTransfer.effectAllowed = 'copy';
    });
    card.addEventListener('click', (e) => {
      if (!touchMode) return;
      // select activity for touch mode
      const prev = document.querySelector('.activity-pool .selected');
      if (prev) prev.classList.remove('selected');
      selectedActivityId = activity.id;
      card.classList.add('selected');
      showMessage('Mode tactile : choisis un créneau pour placer l\'activité.');
    });
    pool.appendChild(card);
  });
}

function renderCalendar() {
  const calendar = document.getElementById('plannerCalendar');
  const weekDates = viewMode === 'day'
    ? [currentDay]
    : Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));

  const weekEvents = viewMode === 'day'
    ? planningEvents.filter(ev => toDateKey(new Date(ev.date)) === toDateKey(currentDay))
    : getPlanningForWeek();

  if (viewMode === 'day') {
    document.getElementById('weekTitle').textContent = `Jour : ${formatDateLabel(currentDay, true)}`;
  } else {
    document.getElementById('weekTitle').textContent = `Semaine du ${formatDateLabel(currentWeekStart, true)} au ${formatDateLabel(addDays(currentWeekStart, 6), true)}`;
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index);

  const header = document.createElement('div');
  header.className = 'planner-header';
  header.innerHTML = '<div class="planner-time-col"></div>' + weekDates.map(date => `
    <div class="planner-day-header">
      <div>${DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1]}</div>
      <strong>${date.getDate()}</strong>
    </div>
  `).join('');
  calendar.innerHTML = '';
  calendar.appendChild(header);

  const body = document.createElement('div');
  body.className = 'planner-body';
  body.innerHTML = hours.map(hour => `
    <div class="planner-hour-row" data-hour="${hour}">
      <div class="planner-time-label">${formatTimeLabel(hour)}</div>
      ${weekDates.map(date => `<div class="planner-slot" data-date="${toDateKey(date)}" data-hour="${hour}"></div>`).join('')}
    </div>
  `).join('');
  calendar.appendChild(body);

  weekEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const slot = calendar.querySelector(`[data-date="${toDateKey(eventDate)}"]`);
    if (!slot) return;
    const row = slot.closest('.planner-hour-row');
    const hourIndex = Number(event.startHour);
    const startOffset = hourIndex - HOUR_START;
    const durationMinutes = parseDurationMinutes(event.duration);
    const eventBox = document.createElement('div');
    eventBox.className = 'planning-event';
    eventBox.dataset.eventId = event.id;
    eventBox.style.background = event.color;
    eventBox.style.top = `${startOffset * SLOT_HEIGHT + 4}px`;
    // allow minute-precise height
    const computedHeight = Math.max(20, Math.round((durationMinutes / 60) * SLOT_HEIGHT) - 8);
    eventBox.style.height = `${computedHeight}px`;
    eventBox.innerHTML = `<strong>${event.title}</strong><span>${event.duration}</span>`;
    eventBox.draggable = true;
    eventBox.addEventListener('dragstart', dragEventStart);
    eventBox.addEventListener('click', () => openEditModal(event.id));
    // add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    eventBox.appendChild(resizeHandle);
    // resize handlers
    (function(evId, handle){
      let startY = 0;
      let startHeight = 0;
      let origMinutes = 0;
      function onMove(e) {
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const dy = clientY - startY;
        const minutesDelta = Math.round((dy / SLOT_HEIGHT) * 60);
        const newMinutes = Math.max(15, origMinutes + minutesDelta);
        const newHeight = Math.max(20, Math.round((newMinutes/60) * SLOT_HEIGHT) - 8);
        eventBox.style.height = `${newHeight}px`;
      }
      function onUp(e) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
        // commit
        const idx = planningEvents.findIndex(x => x.id === evId);
        if (idx >= 0) {
          const styleH = parseInt(eventBox.style.height||0,10) + 8;
          const minutes = Math.max(15, Math.round((styleH / SLOT_HEIGHT) * 60));
          planningEvents[idx].duration = `${minutes}m`;
          savePlanning();
        }
      }
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startY = e.clientY;
        startHeight = parseInt(window.getComputedStyle(eventBox).height,10);
        const idx = planningEvents.findIndex(x => x.id === evId);
        origMinutes = idx>=0 ? parseDurationMinutes(planningEvents[idx].duration) : Math.round((startHeight/ SLOT_HEIGHT)*60);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      handle.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        startY = e.touches[0].clientY;
        startHeight = parseInt(window.getComputedStyle(eventBox).height,10);
        const idx = planningEvents.findIndex(x => x.id === evId);
        origMinutes = idx>=0 ? parseDurationMinutes(planningEvents[idx].duration) : Math.round((startHeight/ SLOT_HEIGHT)*60);
        document.addEventListener('touchmove', onMove, {passive:false});
        document.addEventListener('touchend', onUp);
      });
    })(event.id, resizeHandle);
    const slotWrapper = document.createElement('div');
    slotWrapper.className = 'planner-slot-wrapper';
    slotWrapper.appendChild(eventBox);
    const targetSlot = calendar.querySelector(`.planner-slot[data-date="${toDateKey(eventDate)}"][data-hour="${hourIndex}"]`);
    if (targetSlot) {
      targetSlot.appendChild(slotWrapper);
    }
  });

  calendar.querySelectorAll('.planner-slot').forEach(slot => {
    slot.addEventListener('dragover', event => {
      event.preventDefault();
      slot.classList.add('drop-target');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drop-target'));
    slot.addEventListener('drop', event => {
      event.preventDefault();
      slot.classList.remove('drop-target');
      const data = event.dataTransfer.getData('text/plain');
      if (!data) return;
      try {
        const payload = JSON.parse(data);
        if (payload.activityId) {
          const activity = activities.find(entry => entry.id === payload.activityId);
          if (activity) {
            const date = slot.dataset.date;
            const hour = Number(slot.dataset.hour);
            planningEvents.push(createEventFromActivity(activity, date, hour));
            savePlanning();
            renderCalendar();
            showMessage(`✅ ${activity.title} ajouté au planning.`);
          }
        } else if (payload.eventId) {
          // Move existing event to new slot
          const idx = planningEvents.findIndex(ev => ev.id === payload.eventId);
          if (idx >= 0) {
            planningEvents[idx].date = slot.dataset.date;
            planningEvents[idx].startHour = Number(slot.dataset.hour);
            savePlanning();
            renderCalendar();
            showMessage('✅ Événement déplacé.');
          }
        }
      } catch (e) {}
    });
    // click to create an event quickly or place selected activity in touch mode
    slot.addEventListener('click', (e) => {
      const date = slot.dataset.date;
      const hour = Number(slot.dataset.hour);
      if (touchMode && selectedActivityId) {
        const activity = activities.find(a => a.id === selectedActivityId);
        if (activity) {
          planningEvents.push(createEventFromActivity(activity, date, hour));
          savePlanning();
          renderCalendar();
          showMessage(`✅ ${activity.title} ajouté au planning.`);
        }
        // clear selection
        selectedActivityId = null;
        const prev = document.querySelector('.activity-pool .selected');
        if (prev) prev.classList.remove('selected');
        return;
      }
      openCreateModal(date, hour);
    });
  });
}

function dragEventStart(event) {
  event.dataTransfer.setData('text/plain', JSON.stringify({ eventId: event.currentTarget.dataset.eventId }));
  event.dataTransfer.effectAllowed = 'move';
}

function removeEvent(id) {
  planningEvents = planningEvents.filter(event => event.id !== id);
  savePlanning();
  renderCalendar();
  showMessage('🗑️ Activité retirée du planning.');
}

function showMessage(message) {
  const box = document.getElementById('planningMessage');
  box.textContent = message;
  box.classList.add('show');
  window.clearTimeout(showMessage.timeout);
  showMessage.timeout = window.setTimeout(() => box.classList.remove('show'), 2200);
}

function bindControls() {
  document.getElementById('prevWeekBtn').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    saveView();
    renderCalendar();
  });

  document.getElementById('nextWeekBtn').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    saveView();
    renderCalendar();
  });

  document.getElementById('todayBtn').addEventListener('click', () => {
    currentWeekStart = getStartOfWeek(new Date());
    currentDay = new Date();
    saveView();
    renderCalendar();
  });
  
  // Toggle day/week view
  const toggleBtn = document.getElementById('toggleViewBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      if (viewMode === 'week') {
        viewMode = 'day';
        e.target.textContent = 'Afficher la semaine';
      } else {
        viewMode = 'week';
        e.target.textContent = 'Afficher le jour';
      }
      renderCalendar();
    });
  }

  // Export planning
  const exportBtn = document.getElementById('exportBtnPlanning');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = JSON.stringify({ events: planningEvents, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Import planning
  const importInput = document.getElementById('importPlanningFile');
  const importBtn = document.getElementById('importBtnPlanning');
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (Array.isArray(parsed.events)) {
            planningEvents = parsed.events;
            savePlanning();
            renderCalendar();
            showMessage('✅ Planning importé.');
          } else {
            showMessage('❌ Fichier invalide.');
          }
        } catch (err) { showMessage('❌ Erreur lors de l\'import.'); }
      };
      reader.readAsText(file);
      importInput.value = '';
    });
  }
  // Modal handlers
  const modal = document.getElementById('eventModal');
  const modalSave = document.getElementById('modalSave');
  const modalCancel = document.getElementById('modalCancel');
  const modalDelete = document.getElementById('modalDelete');
  const modalDuplicate = document.getElementById('modalDuplicate');
  const modalRecurrence = document.getElementById('modalRecurrence');
  if (modalSave && modalCancel) {
    modalSave.addEventListener('click', () => {
      const title = document.getElementById('modalTitle').value.trim();
      const duration = document.getElementById('modalDuration').value.trim() || '1h';
      const recurrence = modalRecurrence ? modalRecurrence.value : 'none';
      if (!title) { showMessage('❌ Donne un titre.'); return; }
      // editing existing
      if (window._editingEventId) {
        const idx = planningEvents.findIndex(ev => ev.id === window._editingEventId);
        if (idx >= 0) {
          planningEvents[idx].title = title;
          planningEvents[idx].duration = duration;
          savePlanning();
          // add recurrence copies if requested
          if (recurrence && recurrence !== 'none') {
            createRecurrences(planningEvents[idx], recurrence);
          }
        }
        closeModal();
        renderCalendar();
        showMessage('✅ Événement mis à jour.');
        return;
      }
      // new from selected slot
      if (!window._selectedSlot) return;
      const date = window._selectedSlot.date;
      const hour = Number(window._selectedSlot.hour);
      const ev = {
        id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        activityId: null,
        title,
        date,
        startHour: hour,
        duration,
        theme: 'Perso',
        color: '#4b7bff'
      };
      planningEvents.push(ev);
      // create recurrences
      if (recurrence && recurrence !== 'none') {
        createRecurrences(ev, recurrence);
      }
      savePlanning();
      renderCalendar();
      closeModal();
      showMessage('✅ Événement ajouté.');
    });

    modalCancel.addEventListener('click', () => closeModal());
  }
  if (modalDelete) {
    modalDelete.addEventListener('click', () => {
      if (!window._editingEventId) return;
      removeEvent(window._editingEventId);
      closeModal();
    });
  }
  if (modalDuplicate) {
    modalDuplicate.addEventListener('click', () => {
      if (!window._editingEventId) return;
      const idx = planningEvents.findIndex(ev => ev.id === window._editingEventId);
      if (idx < 0) return;
      const original = planningEvents[idx];
      const d = new Date(original.date);
      d.setDate(d.getDate() + 1);
      const copy = { ...original, id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, date: d.toISOString().slice(0,10) };
      planningEvents.push(copy);
      savePlanning();
      renderCalendar();
      showMessage('✅ Événement dupliqué.');
    });
  }

  // Touch mode toggle
  const toggleTouchBtn = document.getElementById('toggleTouchBtn');
  if (toggleTouchBtn) {
    toggleTouchBtn.addEventListener('click', () => {
      touchMode = !touchMode;
      toggleTouchBtn.classList.toggle('active', touchMode);
      toggleTouchBtn.textContent = touchMode ? 'Mode tactile (ON)' : 'Mode tactile';
      if (!touchMode) {
        selectedActivityId = null;
        const prev = document.querySelector('.activity-pool .selected'); if (prev) prev.classList.remove('selected');
      }
    });
  }
}

function openCreateModal(date, hour) {
  window._selectedSlot = { date, hour };
  const modal = document.getElementById('eventModal');
  document.getElementById('modalTitle').value = '';
  document.getElementById('modalDuration').value = '';
  modal.style.display = 'grid';
  document.getElementById('modalTitle').focus();
}

function openEditModal(eventId) {
  const ev = planningEvents.find(x => x.id === eventId);
  if (!ev) return;
  window._editingEventId = eventId;
  const modal = document.getElementById('eventModal');
  document.getElementById('modalTitle').value = ev.title;
  document.getElementById('modalDuration').value = ev.duration || '';
  const modalDelete = document.getElementById('modalDelete');
  const modalDuplicate = document.getElementById('modalDuplicate');
  if (modalDelete) modalDelete.style.display = 'inline-block';
  if (modalDuplicate) modalDuplicate.style.display = 'inline-block';
  modal.style.display = 'grid';
}

function closeModal() {
  const modal = document.getElementById('eventModal');
  modal.style.display = 'none';
  window._selectedSlot = null;
  window._editingEventId = null;
  const modalDelete = document.getElementById('modalDelete');
  const modalDuplicate = document.getElementById('modalDuplicate');
  if (modalDelete) modalDelete.style.display = 'none';
  if (modalDuplicate) modalDuplicate.style.display = 'none';
}

function initPlanning() {
  loadPlanning();
  const activitiesFromStorage = getActivities();
  activities = Array.isArray(activitiesFromStorage) && activitiesFromStorage.length > 0
    ? activitiesFromStorage
    : (Array.isArray(window.ACTIVITIES_DATA) ? window.ACTIVITIES_DATA : []);
  if (activities.length > 0 && localStorage.getItem('acm_activities') === '[]') {
    localStorage.setItem('acm_activities', JSON.stringify(activities));
    localStorage.setItem('acm_activities_initialized', 'true');
  }
  renderActivityPool();
  bindControls();
  renderCalendar();
}

document.addEventListener('DOMContentLoaded', initPlanning);

function createRecurrences(eventObj, rule) {
  const baseDate = new Date(eventObj.date);
  if (rule === 'daily') {
    for (let i = 1; i <= 6; i++) {
      const d = addDays(baseDate, i);
      const copy = { ...eventObj, id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, date: d.toISOString().slice(0,10) };
      planningEvents.push(copy);
    }
  } else if (rule === 'weekly') {
    for (let i = 1; i <= 3; i++) {
      const d = addDays(baseDate, i*7);
      const copy = { ...eventObj, id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, date: d.toISOString().slice(0,10) };
      planningEvents.push(copy);
    }
  }
  savePlanning();
}
