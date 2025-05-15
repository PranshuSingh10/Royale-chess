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
let moveHistory = [];
let lastMove = null;

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

// Update pieces on the board and display game status
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
      cell.classList.remove('last-move');
      if (lastMove) {
        if ((x === lastMove.from.x && y === lastMove.from.y) ||
            (x === lastMove.to.x && y === lastMove.to.y)) {
          cell.classList.add('last-move');
        }
      }
    }
  }
  
  // Display game-ending conditions
  if (isCheckmate(whiteTurn)) {
    const winner = whiteTurn ? "Black" : "White";
    document.getElementById('turn').textContent = `${whiteTurn ? "White" : "Black"} is in Checkmate! Game Over.`;
    showCheckmatePopup(winner);
  } else if (isStalemate(whiteTurn)) {
    document.getElementById('turn').textContent = "Stalemate! Game Over.";
  } else if (isKingInCheck(whiteTurn)) {
    document.getElementById('turn').textContent = (whiteTurn ? "White's Turn ♔" : "Black's Turn ♚") + ' (Check!)';
  } else {
    document.getElementById('turn').textContent = whiteTurn ? "White's Turn ♔" : "Black's Turn ♚";
  }
  document.getElementById('turn').className = whiteTurn ? 'white' : 'black';
}

// Revised getPossibleMoves now accepts an optional board state parameter for move simulation.
function getPossibleMoves(x, y, piece, boardState = board) {
  const moves = [];
  const isWhite = piece === piece.toUpperCase();
  const directions = {
    n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
    k: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
  };

  // Pawn moves, including initial double-step and captures.
  if (piece.toLowerCase() === 'p') {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    if (boardState[y + dir] && boardState[y + dir][x] === '') {
      moves.push([x, y + dir]);
    }
    if (y === startRow && boardState[y + dir] && boardState[y + dir][x] === '' &&
        boardState[y + 2 * dir] && boardState[y + 2 * dir][x] === '') {
      moves.push([x, y + 2 * dir]);
    }
    for (let dx of [-1, 1]) {
      if (boardState[y + dir] && boardState[y + dir][x + dx] && boardState[y + dir][x + dx] !== '') {
        const target = boardState[y + dir][x + dx];
        if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push([x + dx, y + dir]);
        }
      }
    }
  }
  // Knight moves.
  else if (piece.toLowerCase() === 'n') {
    for (let [dx, dy] of directions.n) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        let target = boardState[ny][nx];
        if (!target || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push([nx, ny]);
        }
      }
    }
  }
  // Bishop, Rook, and Queen moves.
  else if (['b', 'r', 'q'].includes(piece.toLowerCase())) {
    let dirs = [];
    if (piece.toLowerCase() === 'b') dirs = directions.b;
    if (piece.toLowerCase() === 'r') dirs = directions.r;
    if (piece.toLowerCase() === 'q') dirs = directions.q;
    for (let [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = boardState[ny][nx];
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
  // King moves.
  else if (piece.toLowerCase() === 'k') {
    for (let [dx, dy] of directions.k) {
      let nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = boardState[ny][nx];
        if (!target || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push([nx, ny]);
        }
      }
    }
    // (Castling logic could be added here in the future.)
  }
  return moves;
}

// Return legal moves for a piece after simulating the move to ensure it won't expose the king to check.
function getLegalMoves(x, y, piece, isWhite) {
  const moves = getPossibleMoves(x, y, piece);
  return moves.filter(([mx, my]) => {
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[my][mx] = piece;
    tempBoard[y][x] = '';
    return !isKingInCheck(isWhite, tempBoard);
  });
}

// Handle piece selection and movement.
function handleCellClick(e) {
  if (isCheckmate(whiteTurn) || isStalemate(whiteTurn)) return; // Prevent moves after game over

  const [x, y] = e.target.id.split('_').map(Number);
  const piece = board[y][x];

  clearHighlights();

  if (!selected && piece && isPlayerPiece(piece)) {
    clearSelection();
    selected = { x, y };
    e.target.classList.add('selected');
    const moves = getLegalMoves(x, y, piece, whiteTurn);
    moves.forEach(([mx, my]) => {
      const moveCell = document.getElementById(`${mx}_${my}`);
      if (moveCell) moveCell.classList.add('possible-move');
    });
  } else if (selected) {
    const moves = getLegalMoves(selected.x, selected.y, board[selected.y][selected.x], whiteTurn);
    if (moves.some(([mx, my]) => mx === x && my === y)) {
      movePiece(selected, { x, y });
    }
    clearSelection();
    // Only call renderBoard if no move was made
    if (!moves.some(([mx, my]) => mx === x && my === y)) {
      renderBoard();
    }
  }
}

// Move a piece and update game state.
function movePiece(from, to) {
  const movingPiece = board[from.y][from.x];
  const capturedPiece = board[to.y][to.x];

  moveHistory.push({
    from: { ...from },
    to: { ...to },
    movingPiece,
    capturedPiece,
    board: JSON.parse(JSON.stringify(board)),
    whiteTurn: whiteTurn
  });

  board[to.y][to.x] = movingPiece;
  board[from.y][from.x] = '';

  // Pawn promotion: auto-promote to Queen when reaching the final rank.
  if (movingPiece === 'P' && to.y === 0) {
    board[to.y][to.x] = 'Q';
  }
  else if (movingPiece === 'p' && to.y === 7) {
    board[to.y][to.x] = 'q';
  }

  lastMove = { from, to };
  whiteTurn = !whiteTurn;
  document.getElementById('moveSound').play();
  renderBoard();
  updateMoveHistory();
}

function clearHighlights() {
  document.querySelectorAll('.possible-move').forEach(cell => cell.classList.remove('possible-move'));
}

// Clear selected piece and highlights.
function clearSelection() {
  selected = null;
  document.querySelectorAll('.selected').forEach(cell => cell.classList.remove('selected'));
  clearHighlights();
}

function isPlayerPiece(piece) {
  return (whiteTurn && piece === piece.toUpperCase()) || (!whiteTurn && piece === piece.toLowerCase());
}

function updateMoveHistory() {
  const moveHistoryDiv = document.getElementById('moveHistory');
  moveHistoryDiv.innerHTML = moveHistory.map((move, i) => {
    const from = String.fromCharCode(97 + move.from.x) + (8 - move.from.y);
    const to = String.fromCharCode(97 + move.to.x) + (8 - move.to.y);
    return `<span style="margin-right:8px;">${i % 2 === 0 ? ((i / 2) + 1) + '. ' : ''}${from}-${to}</span>`;
  }).join('');
}

// Check if the king is in check using a simulated board state.
function isKingInCheck(isWhite, customBoard = board) {
  let kingPos = null;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = customBoard[y][x];
      if (piece && ((isWhite && piece === 'K') || (!isWhite && piece === 'k'))) {
        kingPos = { x, y };
      }
    }
  }
  if (!kingPos) return false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = customBoard[y][x];
      if (piece && ((isWhite && piece === piece.toLowerCase()) || (!isWhite && piece === piece.toUpperCase()))) {
        const moves = getPossibleMoves(x, y, piece, customBoard);
        if (moves.some(([mx, my]) => mx === kingPos.x && my === kingPos.y)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Determine if the current player is in checkmate.
function isCheckmate(isWhite) {
  if (!isKingInCheck(isWhite)) return false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && ((isWhite && piece === piece.toUpperCase()) || (!isWhite && piece === piece.toLowerCase()))) {
        const moves = getLegalMoves(x, y, piece, isWhite);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

// Determine if the current player is in stalemate.
function isStalemate(isWhite) {
  if (isKingInCheck(isWhite)) return false;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && ((isWhite && piece === piece.toUpperCase()) || (!isWhite && piece === piece.toLowerCase()))) {
        const moves = getLegalMoves(x, y, piece, isWhite);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

// Show checkmate popup
function showCheckmatePopup(winner) {
  // Hide the existing text at the top (optional)
  document.getElementById('turn').style.visibility = 'hidden';
  
  // Set popup content
  document.getElementById('winner-text').textContent = `Checkmate!`;
  document.getElementById('winner-details').textContent = `${winner} wins the game!`;
  
  // Show popup with delay for dramatic effect
  setTimeout(() => {
    document.getElementById('checkmate-popup').classList.add('active');
    // Play sound if you have one
    // document.getElementById('victorySound').play();
  }, 500);
}

// Reset the game
function resetGame() {
  board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
  
  // Reset all game variables
  selected = null;
  whiteTurn = true;
  moveHistory = [];
  lastMove = null;
  
  // Hide the popup
  document.getElementById('checkmate-popup').classList.remove('active');
  
  // Show the turn indicator again
  document.getElementById('turn').style.visibility = 'visible';
  
  // Update the board
  renderBoard();
  if (document.getElementById('moveHistory')) {
    updateMoveHistory();
  }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  createBoard();
  renderBoard();
  
  // Add event listener for the New Game button
  document.getElementById('new-game-btn').addEventListener('click', resetGame);
});

document.getElementById('undoBtn').onclick = function() {
  if (moveHistory.length > 0) {
    const last = moveHistory.pop();
    board = JSON.parse(JSON.stringify(last.board));
    whiteTurn = last.whiteTurn;
    lastMove = moveHistory.length > 0 ? { from: moveHistory[moveHistory.length - 1].from, to: moveHistory[moveHistory.length - 1].to } : null;
    renderBoard();
    updateMoveHistory();
  }
};

