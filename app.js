const board = document.querySelector('#board');
const timer = document.querySelector('#timer');
const notesButton = document.querySelector('#notes');
const resetButton = document.querySelector('#reset');
const modeButtons = [...document.querySelectorAll('[data-level]')];

let puzzle = [];
let original = [];
let solution = [];
let selected = null;
let notesMode = false;
let startedAt = 0;
let timerId;
let activeLevel = 'easy';

const blankCount = { easy: 38, medium: 48, hard: 56 };

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeSolution() {
  const rows = shuffled([0, 1, 2]).flatMap(group => shuffled([0, 1, 2]).map(row => group * 3 + row));
  const cols = shuffled([0, 1, 2]).flatMap(group => shuffled([0, 1, 2]).map(col => group * 3 + col));
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return rows.map(row => cols.map(col => digits[(row * 3 + Math.floor(row / 3) + col) % 9]));
}

function newGame(level) {
  activeLevel = level;
  solution = makeSolution().flat();
  puzzle = solution.flat();
  shuffled([...Array(81).keys()]).slice(0, blankCount[level]).forEach(index => { puzzle[index] = null; });
  original = [...puzzle];
  selected = null;
  modeButtons.forEach(button => button.classList.toggle('active', button.dataset.level === level));
  render();
  startTimer();
}

function render() {
  board.replaceChildren();
  puzzle.forEach((value, index) => {
    const cell = document.createElement('button');
    const given = original[index] !== null;
    const answer = typeof value === 'number' && !given;
    cell.className = `cell${given ? ' given' : ''}${selected === index ? ' selected' : ''}${typeof value === 'string' ? ' notes' : ''}${answer ? (value === solution[index] ? ' correct' : ' incorrect') : ''}`;
    if (typeof value === 'string') {
      const notes = document.createElement('span');
      notes.className = 'note-grid';
      for (let number = 1; number <= 9; number += 1) {
        const note = document.createElement('span');
        note.textContent = value.includes(String(number)) ? number : '';
        notes.append(note);
      }
      cell.append(notes);
    } else {
      cell.textContent = value || '';
    }
    cell.disabled = given;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}`);
    cell.addEventListener('click', () => { selected = index; render(); });
    board.append(cell);
  });
}

function enter(value) {
  if (selected === null || original[selected] !== null) return;
  const current = puzzle[selected];
  if (notesMode && value) {
    const notes = typeof current === 'string' ? current.split('') : [];
    puzzle[selected] = notes.includes(value) ? notes.filter(note => note !== value).join('') || null : [...notes, value].sort().join('');
  } else {
    puzzle[selected] = value ? Number(value) : null;
  }
  render();
}

function startTimer() {
  clearInterval(timerId);
  startedAt = Date.now();
  timer.textContent = '00:00';
  timerId = setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, 1000);
}

document.addEventListener('keydown', event => {
  if (/^[1-9]$/.test(event.key)) enter(event.key);
  if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') enter(null);
});
notesButton.addEventListener('click', () => {
  notesMode = !notesMode;
  notesButton.setAttribute('aria-pressed', notesMode);
});
resetButton.addEventListener('click', () => {
  notesMode = false;
  notesButton.setAttribute('aria-pressed', 'false');
  newGame(activeLevel);
});
modeButtons.forEach(button => button.addEventListener('click', () => newGame(button.dataset.level)));
newGame('easy');
