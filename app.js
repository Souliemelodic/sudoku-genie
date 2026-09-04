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

// ===== UNDO =====
function undo() {
    if (history.length === 0) {
        // Optional: Visual feedback that nothing to undo
        const undoBtn = document.querySelector('#undo');
        if (undoBtn) {
            undoBtn.style.transform = 'scale(0.9)';
            undoBtn.style.opacity = '0.5';
            setTimeout(() => {
                undoBtn.style.transform = '';
                undoBtn.style.opacity = '1';
            }, 300);
        }
        return;
    }
    const lastMove = history.pop();
    puzzle[lastMove.index] = lastMove.value;
    render();
}

// ===== HINT =====
function giveHint() {
    if (hintsLeft <= 0) {
        alert('No hints left! You used all 3 hints. ');
        return;
    }
    
    // Find first empty or incorrect cell
    const emptyIndex = puzzle.findIndex((val, idx) => 
        (val === null || (typeof val === 'number' && val !== solution[idx])) && 
        original[idx] === null
    );
    
    if (emptyIndex === -1) {
        alert('🎉 Puzzle is already solved! No hints needed.');
        return;
    }
    
    // Place the correct number
    puzzle[emptyIndex] = solution[emptyIndex];
    original[emptyIndex] = solution[emptyIndex]; // Lock it so user can't change it
    hintsLeft--;
    
    // Visual feedback
    const row = Math.floor(emptyIndex / 9) + 1;
    const col = (emptyIndex % 9) + 1;
    render();
    
    // Show hint message
    const hintMessage = `💡 Hint placed at Row ${row}, Column ${col}! (${hintsLeft} hints remaining)`;
    showTemporaryMessage(hintMessage);
}

// ===== SHOW TEMPORARY MESSAGE (Helper) =====
function showTemporaryMessage(message) {
    // Remove any existing message
    const existing = document.querySelector('.temp-message');
    if (existing) existing.remove();
    
    // Create message element
    const msg = document.createElement('div');
    msg.className = 'temp-message';
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(24, 32, 51, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 1rem;
        z-index: 1000;
        animation: fadeInUp 0.3s ease;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(msg);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transition = 'opacity 0.3s';
        setTimeout(() => msg.remove(), 300);
    }, 2000);
}