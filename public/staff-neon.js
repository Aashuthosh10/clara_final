(() => {
  const state = { token: null, staff: null, socket: null };

  document.addEventListener('DOMContentLoaded', () => {
    hydrateFromExistingSession();
    initHeader();
    initSocket();
    loadAllPanels();
  });

  function hydrateFromExistingSession(){
    // compatibility with existing flows
    const jwt = localStorage.getItem('token') || localStorage.getItem('staffToken');
    state.token = jwt || null;
    const ss = sessionStorage.getItem('staffData');
    if (ss){
      try { state.staff = JSON.parse(ss); } catch(_){}
    }
  }

  function initHeader(){
    const name = document.getElementById('staffName');
    const role = document.getElementById('staffRole');
    const avatar = document.getElementById('avatar');
    const logout = document.getElementById('logoutBtn');
    if (state.staff){
      name.textContent = state.staff.name || 'Staff';
      role.textContent = state.staff.department || 'Department';
      avatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(state.staff.name||'S')}`;
    }
    logout?.addEventListener('click', () => {
      try{ localStorage.removeItem('token'); localStorage.removeItem('staffToken'); }catch(_){ }
      sessionStorage.removeItem('staffData');
      sessionStorage.removeItem('isLoggedIn');
      window.location.href = '/staff-login';
    });
  }

  function initSocket(){
    try {
      state.socket = io();
      const chip = document.getElementById('connChip');
      state.socket.on('connect', () => { chip.textContent = 'Connected'; chip.classList.remove('off'); chip.classList.add('on'); });
      state.socket.on('disconnect', () => { chip.textContent = 'Offline'; chip.classList.remove('on'); chip.classList.add('off'); });

      // incoming video-call requests (server already emits this event)
      state.socket.on('video-call-request', (req) => addIncoming(req));
      state.socket.on('new-call-request', (req) => addIncoming(req));
    } catch (_) {}
  }

  function authHeaders(){
    return state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
  }

  async function loadAllPanels(){
    await Promise.all([
      loadTimetable(),
      loadIncomingCalls(),
      loadCallLog(),
      loadAppointments()
    ]);
  }

  // Timetable
  async function loadTimetable(){
    try{
      const res = await fetch('/api/timetable/my-timetable',{ headers: { ...authHeaders() }});
      const data = await res.json();
      renderTimetable(data?.timetable || null, data?.hasTimetable);
    }catch(_){ renderTimetable(null,false); }
  }
  function renderTimetable(tt, has){
    const root = document.getElementById('timetable');
    const upd = document.getElementById('ttUpdated');
    if (!has || !tt || !Array.isArray(tt.schedule)){
      root.innerHTML = '<div class="muted">No timetable yet</div>';
      upd.textContent = '';
      return;
    }
    upd.textContent = tt.lastUpdated ? new Date(tt.lastUpdated).toLocaleString() : '';
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    root.innerHTML = days.map(d => {
      const day = tt.schedule.find(s => (s.day||'').toLowerCase() === d.toLowerCase());
      const blocks = (day?.timeSlots||[]).map(s => `<div class="slot">${s.subject||s.activity||'—'}<br><span class="muted">${s.startTime||s.timeSlot?.start} - ${s.endTime||s.timeSlot?.end}</span></div>`).join('');
      return `<div class="day"><div class="muted" style="margin-bottom:6px">${d}</div>${blocks||'<div class="muted">No events</div>'}</div>`;
    }).join('');
  }

  // Calls incoming
  async function loadIncomingCalls(){
    // No explicit HTTP; rely on live events + empty state
    document.getElementById('incomingCalls').innerHTML = '<div class="muted">No incoming requests</div>';
  }
  function addIncoming(req){
    const box = document.getElementById('incomingCalls');
    if (box.querySelector('.muted')) box.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div class="meta"><div class="pill">Call</div><div>${req.clientName||'Client'}</div></div><div class="time">${new Date(req.requestTime||req.timestamp||Date.now()).toLocaleTimeString()}</div><button class="action" data-id="${req.requestId||req.callId}">View</button>`;
    box.prepend(row);
    document.getElementById('incomingCount').textContent = '';
  }

  // Call log
  async function loadCallLog(){
    try{
      const res = await fetch('/api/calls/my-calls',{ headers: { 'Content-Type':'application/json', ...authHeaders() }});
      if (!res.ok) throw new Error('unauth');
      const calls = await res.json();
      const box = document.getElementById('callLog');
      if (!Array.isArray(calls) || calls.length===0){ box.innerHTML = '<div class="muted">No calls yet</div>'; return; }
      document.getElementById('logCount').textContent = `${calls.length}`;
      box.innerHTML = calls.slice(0,6).map(c => `<div class="row"><div class="meta"><div class="pill ${c.decision==='rejected'?'red':''}">${c.decision||c.status||''}</div><div>${c.clientId?.name||'Client'}</div></div><div class="time">${new Date(c.createdAt).toLocaleTimeString()}</div></div>`).join('');
    }catch(_){ document.getElementById('callLog').innerHTML = '<div class="muted">Login to view call log</div>'; }
  }

  // Appointments (best-effort using model helpers if API not present). We’ll use upcoming via Appointment.findUpcoming on server if exposed; fallback empty.
  async function loadAppointments(){
    try{
      const res = await fetch('/api/appointments/upcoming',{ headers: { ...authHeaders() }});
      if (!res.ok) throw 0;
      const ap = await res.json();
      renderAppointments(ap);
    }catch(_){
      document.getElementById('appointments').innerHTML = '<div class="muted">No upcoming appointments endpoint</div>';
    }
  }
  function renderAppointments(items){
    const box = document.getElementById('appointments');
    if (!Array.isArray(items) || items.length===0){ box.innerHTML = '<div class="muted">No appointments</div>'; return; }
    document.getElementById('apptCount').textContent = `${items.length}`;
    box.innerHTML = items.slice(0,6).map(a => `<div class="row"><div class="meta"><div class="pill">${a.status||'Pending'}</div><div>${a.clientName||a.clientId?.name||'Client'}</div></div><div class="time">${formatAppt(a)}</div><button class="action">View</button></div>`).join('');
  }

  function formatAppt(a){
    const dt = a.appointmentDate ? new Date(a.appointmentDate) : null;
    const t = a.appointmentTime?.start || a.time || '';
    return dt ? `${dt.toLocaleDateString()} ${t}` : t || '';
  }

  // Enhanced timetable loading
  async function loadWeeklyTimetable() {
    try {
      const response = await fetch('/api/timetable/weekly', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        displayWeeklyTimetable(data.weeklyTimetable);
      }
    } catch (error) {
      console.error('Error loading weekly timetable:', error);
    }
  }

  function displayWeeklyTimetable(weeklyData) {
    const timetableContainer = document.getElementById('timetable');
    if (!timetableContainer) return;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let html = '<div class="weekly-grid">';
    
    days.forEach(day => {
      const daySlots = weeklyData[day] || [];
      html += `
        <div class="day-column">
          <h4>${day.charAt(0).toUpperCase() + day.slice(1)}</h4>
          <div class="day-slots">
            ${daySlots.map(slot => `
              <div class="time-slot">
                <div class="slot-time">${slot.startTime}-${slot.endTime}</div>
                <div class="slot-subject">${slot.subject}</div>
                <div class="slot-room">${slot.room}</div>
              </div>
            `).join('') || '<div class="no-slots">No classes</div>'}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    timetableContainer.innerHTML = html;
  }

  // Enhanced call log loading
  async function loadCallHistory() {
    try {
      const response = await fetch('/api/calls', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        displayCallHistory(data.calls);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  }

  function displayCallHistory(calls) {
    const callLogContainer = document.getElementById('callLog');
    if (!callLogContainer) return;

    if (!calls || calls.length === 0) {
      callLogContainer.innerHTML = '<div class="empty-state">No calls yet</div>';
      return;
    }

    const html = calls.map(call => `
      <div class="call-item ${call.status}">
        <div class="call-meta">
          <div class="call-client">${call.clientId?.name || 'Unknown'}</div>
          <div class="call-purpose">${call.purpose}</div>
          <div class="call-time">${new Date(call.createdAt).toLocaleString()}</div>
          ${call.updates && call.updates.length > 0 ? 
            `<div class="call-updates">${call.updates.length} update(s)</div>` : ''
          }
        </div>
        <div class="call-status ${call.status}">${call.status}</div>
      </div>
    `).join('');

    callLogContainer.innerHTML = html;
  }

  // Enhanced appointments loading
  async function loadAppointments() {
    try {
      const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        displayAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  function displayAppointments(appointments) {
    const appointmentsContainer = document.getElementById('appointments');
    if (!appointmentsContainer) return;

    if (!appointments || appointments.length === 0) {
      appointmentsContainer.innerHTML = '<div class="empty-state">No appointments</div>';
      return;
    }

    const html = appointments.map(appointment => `
      <div class="appointment-item ${appointment.status}">
        <div class="appointment-meta">
          <div class="appointment-client">${appointment.clientName}</div>
          <div class="appointment-purpose">${appointment.purpose}</div>
          <div class="appointment-time">${new Date(appointment.appointmentDate).toLocaleDateString()} ${appointment.appointmentTime.start}-${appointment.appointmentTime.end}</div>
        </div>
        <div class="appointment-status ${appointment.status}">${appointment.status}</div>
        <div class="appointment-actions">
          <button onclick="viewAppointment('${appointment._id}')" class="btn-small">View</button>
          <button onclick="updateAppointment('${appointment._id}')" class="btn-small">Update</button>
        </div>
      </div>
    `).join('');

    appointmentsContainer.innerHTML = html;
  }

  // Add to existing loadAllData function
  function loadAllData() {
    loadDashboardData();
    loadCallHistory();
    loadAppointments();
    loadWeeklyTimetable(); // Add this line
  }
})();



