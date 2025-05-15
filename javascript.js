const pieces = {
  r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟',
  R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙'
};

let board = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

let selected = null;
let whiteTurn = true;

// Build the board grid and attach click handlers
function createBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement('div');
      cell.id = `${x}_${y}`;
      cell.classList.add('gamecell');
      cell.classList.add((x + y) % 2 === 0 ? 'light' : 'dark');
      cell.addEventListener('click', handleCellClick);
      boardEl.appendChild(cell);
    }
  }
}

// Update pieces on the board
function renderBoard() {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.getElementById(`${x}_${y}`);
      cell.textContent = pieces[board[y][x]] || '';
    }
  }
  document.getElementById('turn').textContent = whiteTurn ? "White's Turn ♔" : "Black's Turn ♚";
}

// Handle piece selection and movement
function handleCellClick(e) {
  const [x, y] = e.target.id.split('_').map(Number);
  const piece = board[y][x];

  if (!selected && piece && isPlayerPiece(piece)) {
    clearSelection();
    selected = { x, y };
    e.target.classList.add('selected');
  } else if (selected) {
    movePiece(selected, { x, y });
    clearSelection();
    renderBoard();
  }
}

function movePiece(from, to) {
  const movingPiece = board[from.y][from.x];
  board[to.y][to.x] = movingPiece;
  board[from.y][from.x] = '';
  whiteTurn = !whiteTurn;
}

function clearSelection() {
  selected = null;
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
}

function isPlayerPiece(piece) {
  return (whiteTurn && piece === piece.toUpperCase()) || (!whiteTurn && piece === piece.toLowerCase());
}

// Initialize game
createBoard();
renderBoard();
