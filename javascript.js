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
      const piece = board[y][x];
      cell.textContent = pieces[piece] || '';
      cell.classList.remove('white-piece', 'black-piece');
      if (piece) {
        if (piece === piece.toUpperCase()) {
          cell.classList.add('white-piece');
        } else {
          cell.classList.add('black-piece');
        }
      }
    }
  }
  document.getElementById('turn').textContent = whiteTurn ? "White's Turn ♔" : "Black's Turn ♚";
  document.getElementById('turn').className = whiteTurn ? 'white' : 'black';
}

// Get possible moves for a piece
function getPossibleMoves(x, y, piece) {
  const moves = [];
  const isWhite = piece === piece.toUpperCase();
  const directions = {
    n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
    k: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
  };

  // Pawn
  if (piece.toLowerCase() === 'p') {
    let dir = isWhite ? -1 : 1;
    let startRow = isWhite ? 6 : 1;
    // Forward move
    if (board[y + dir] && !board[y + dir][x]) moves.push([x, y + dir]);
    // Double move from start
    if (y === startRow && board[y + dir] && !board[y + dir][x] && !board[y + 2 * dir][x]) moves.push([x, y + 2 * dir]);
    // Captures
    for (let dx of [-1, 1]) {
      if (
        board[y + dir] &&
        board[y + dir][x + dx] &&
        ((isWhite && board[y + dir][x + dx] === board[y + dir][x + dx].toLowerCase()) ||
         (!isWhite && board[y + dir][x + dx] === board[y + dir][x + dx].toUpperCase()))
      ) {
        moves.push([x + dx, y + dir]);
      }
    }
  }
  // Knight
  else if (piece.toLowerCase() === 'n') {
    for (let [dx, dy] of directions.n) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        let target = board[ny][nx];
        if (!target || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push([nx, ny]);
        }
      }
    }
  }
  // Bishop, Rook, Queen
  else if (['b', 'r', 'q'].includes(piece.toLowerCase())) {
    let dirs = [];
    if (piece.toLowerCase() === 'b') dirs = directions.b;
    if (piece.toLowerCase() === 'r') dirs = directions.r;
    if (piece.toLowerCase() === 'q') dirs = directions.q;
    for (let [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        let target = board[ny][nx];
        if (!target) {
          moves.push([nx, ny]);
        } else {
          if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
            moves.push([nx, ny]);
          }
          break;
        }
        nx += dx;
        ny += dy;
      }
    }
  }
  // King
  else if (piece.toLowerCase() === 'k') {
    for (let [dx, dy] of directions.k) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        let target = board[ny][nx];
        if (!target || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push([nx, ny]);
        }
      }
    }
  }
  return moves;
}

// Handle piece selection and movement
function handleCellClick(e) {
  const [x, y] = e.target.id.split('_').map(Number);
  const piece = board[y][x];

  clearHighlights();

  if (!selected && piece && isPlayerPiece(piece)) {
    clearSelection();
    selected = { x, y };
    e.target.classList.add('selected');
    // Highlight possible moves
    const moves = getPossibleMoves(x, y, piece);
    moves.forEach(([mx, my]) => {
      const moveCell = document.getElementById(`${mx}_${my}`);
      if (moveCell) moveCell.classList.add('possible-move');
    });
  } else if (selected) {
    // Only allow move if it's a possible move
    const moves = getPossibleMoves(selected.x, selected.y, board[selected.y][selected.x]);
    if (moves.some(([mx, my]) => mx === x && my === y)) {
      movePiece(selected, { x, y });
    }
    clearSelection();
    renderBoard();
  }
}

function movePiece(from, to) {
  const movingPiece = board[from.y][from.x];
  board[to.y][to.x] = movingPiece;
  board[from.y][from.x] = '';
  whiteTurn = !whiteTurn;
  // After a successful move in your movePiece function:
  document.getElementById('moveSound').play();
}

function clearHighlights() {
  document.querySelectorAll('.possible-move').forEach(cell => cell.classList.remove('possible-move'));
}

// In clearSelection, also clear highlights
function clearSelection() {
  selected = null;
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  clearHighlights();
}

function isPlayerPiece(piece) {
  return (whiteTurn && piece === piece.toUpperCase()) || (!whiteTurn && piece === piece.toLowerCase());
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  createBoard();
  renderBoard();
});
