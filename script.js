/* =====================================================
   ATTENDANCE MANAGEMENT SYSTEM
   Data model (saved in localStorage):

   students: [{ id, roll, name }]
   attendance: {
     "2026-07-05": { studentId: "present" | "absent", ... },
     ...
   }
===================================================== */

const STUDENTS_KEY = "ams_students";
const ATTENDANCE_KEY = "ams_attendance";

let students = loadStudents();
let attendance = loadAttendance();

/* ---------------- storage helpers ---------------- */

function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function loadAttendance() {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStudents() {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

function saveAttendance() {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
}

/* ---------------- utilities ---------------- */

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function makeId() {
  return "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function sortedStudents() {
  return [...students].sort((a, b) => {
    const ra = parseFloat(a.roll);
    const rb = parseFloat(b.roll);
    if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

/** Attendance % for a student across all recorded dates. */
function attendancePercent(studentId) {
  let total = 0;
  let present = 0;
  for (const date in attendance) {
    const record = attendance[date][studentId];
    if (record) {
      total++;
      if (record === "present") present++;
    }
  }
  if (total === 0) return null;
  return Math.round((present / total) * 100);
}

/* ---------------- tab switching ---------------- */

const tabs = document.querySelectorAll(".tab");
const pages = document.querySelectorAll(".page");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");

    pages.forEach((p) => p.classList.remove("is-active"));
    document.getElementById("page-" + tab.dataset.tab).classList.add("is-active");

    if (tab.dataset.tab === "history") renderHistory();
  });
});

/* ---------------- roster tab ---------------- */

const addStudentForm = document.getElementById("addStudentForm");
const rosterList = document.getElementById("rosterList");
const rosterEmpty = document.getElementById("rosterEmpty");

addStudentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const rollInput = document.getElementById("newRoll");
  const nameInput = document.getElementById("newName");

  const roll = rollInput.value.trim();
  const name = nameInput.value.trim();
  if (!roll || !name) return;

  students.push({ id: makeId(), roll, name });
  saveStudents();

  rollInput.value = "";
  nameInput.value = "";
  rollInput.focus();

  renderRoster();
  renderRollCall();
});

function removeStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;
  if (!confirm(`Remove ${student.name} from the roster? This also deletes their attendance history.`)) return;

  students = students.filter((s) => s.id !== id);
  saveStudents();

  for (const date in attendance) {
    delete attendance[date][id];
  }
  saveAttendance();

  renderRoster();
  renderRollCall();
  renderHistory();
}

function renderRoster() {
  rosterList.innerHTML = "";
  const list = sortedStudents();
  rosterEmpty.hidden = list.length !== 0;

  list.forEach((student) => {
    const row = document.createElement("div");
    row.className = "ledger-row";
    row.innerHTML = `
      <span class="roll">#${student.roll}</span>
      <span class="name">${escapeHtml(student.name)}</span>
      <button class="remove-btn" data-id="${student.id}">Remove</button>
    `;
    row.querySelector(".remove-btn").addEventListener("click", () => removeStudent(student.id));
    rosterList.appendChild(row);
  });
}

/* ---------------- today's roll call tab ---------------- */

const attendanceDateInput = document.getElementById("attendanceDate");
const rollCallList = document.getElementById("rollCallList");
const rollCallEmpty = document.getElementById("rollCallEmpty");
const todaySummary = document.getElementById("todaySummary");

attendanceDateInput.value = todayISO();
attendanceDateInput.addEventListener("change", renderRollCall);

function markAttendance(studentId, status, buttonEl) {
  const date = attendanceDateInput.value || todayISO();
  if (!attendance[date]) attendance[date] = {};
  attendance[date][studentId] = status;
  saveAttendance();

  renderRollCall();
  spawnStamp(buttonEl, status);
}

function renderRollCall() {
  const date = attendanceDateInput.value || todayISO();
  const dayRecord = attendance[date] || {};
  const list = sortedStudents();

  rollCallList.innerHTML = "";
  rollCallEmpty.hidden = list.length !== 0;

  let presentCount = 0;
  let markedCount = 0;

  list.forEach((student) => {
    const status = dayRecord[student.id];
    if (status) markedCount++;
    if (status === "present") presentCount++;

    const row = document.createElement("div");
    row.className = "ledger-row";
    row.innerHTML = `
      <span class="roll">#${student.roll}</span>
      <span class="name">${escapeHtml(student.name)}</span>
      <div class="mark-group">
        <button class="mark-btn present ${status === "present" ? "is-selected" : ""}" data-status="present">Present</button>
        <button class="mark-btn absent ${status === "absent" ? "is-selected" : ""}" data-status="absent">Absent</button>
      </div>
    `;
    row.querySelector(".present").addEventListener("click", (e) => markAttendance(student.id, "present", e.target));
    row.querySelector(".absent").addEventListener("click", (e) => markAttendance(student.id, "absent", e.target));
    rollCallList.appendChild(row);
  });

  todaySummary.textContent = list.length
    ? `${presentCount}/${list.length} present · ${markedCount}/${list.length} marked`
    : "";
}

/** Small stamp animation near the clicked button, for tactile feedback. */
function spawnStamp(buttonEl, status) {
  if (!buttonEl) return;
  const rect = buttonEl.getBoundingClientRect();
  const stamp = document.createElement("div");
  stamp.className = `stamp-mark ${status}`;
  stamp.textContent = status === "present" ? "Present" : "Absent";
  stamp.style.left = rect.left + rect.width / 2 - 40 + "px";
  stamp.style.top = rect.top - 10 + "px";

  const layer = document.getElementById("stampLayer");
  layer.appendChild(stamp);
  stamp.addEventListener("animationend", () => stamp.remove());
}

/* ---------------- history tab ---------------- */

const historyDateInput = document.getElementById("historyDate");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const percentList = document.getElementById("percentList");

historyDateInput.value = todayISO();
historyDateInput.addEventListener("change", renderHistory);

function renderHistory() {
  const date = historyDateInput.value || todayISO();
  const dayRecord = attendance[date] || {};
  const list = sortedStudents();

  historyList.innerHTML = "";
  const marked = list.filter((s) => dayRecord[s.id]);
  historyEmpty.hidden = marked.length !== 0;

  marked.forEach((student) => {
    const status = dayRecord[student.id];
    const row = document.createElement("div");
    row.className = "ledger-row";
    row.innerHTML = `
      <span class="roll">#${student.roll}</span>
      <span class="name">${escapeHtml(student.name)}</span>
      <span class="status-pill ${status}">${status}</span>
    `;
    historyList.appendChild(row);
  });

  renderPercentages(list);
}

function renderPercentages(list) {
  percentList.innerHTML = "";

  list.forEach((student) => {
    const pct = attendancePercent(student.id);
    const displayPct = pct === null ? "—" : pct + "%";
    const barWidth = pct === null ? 0 : pct;

    const row = document.createElement("div");
    row.className = "ledger-row";
    row.innerHTML = `
      <span class="roll">#${student.roll}</span>
      <span class="name">${escapeHtml(student.name)}</span>
      <div class="percent-bar-wrap"><div class="percent-bar" style="width:${barWidth}%"></div></div>
      <span class="percent">${displayPct}</span>
    `;
    percentList.appendChild(row);
  });
}

/* ---------------- helpers ---------------- */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------- init ---------------- */

renderRoster();
renderRollCall();
renderHistory();
