
// final code bh GPT

document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const chess = new Chess();
    const boardElement = document.querySelector(".chessboard");

    let draggedPiece = null;
    let sourceSquare = null;
    let playerRole = null;

    const renderBoard = () => {
        const board = chess.board();
        boardElement.innerHTML = "";  // kuch bhi galti se bhi chess boar  meh likha hi to usse khali kr do, or next time jab render hoga to usse khalli kar ke he do
        board.forEach((row, rowindex) => {
            row.forEach((square, squareindex) => {
                const squareElement = document.createElement("div");  //ek dynamic div create kia gya hai jo ki forEach meh iterate hoga, niche wala code black and white pattern ka color bana nek lia hai
                squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark"); // yeh chess board ka jo pattern uske color ko decide kia

                squareElement.dataset.row = rowindex;
                squareElement.dataset.col = squareindex;

                if (square) {
                    const pieceElement = document.createElement("div");
                    pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                    pieceElement.innerText = getPieceUnicode(square);
                    pieceElement.draggable = playerRole === square.color;

                    pieceElement.addEventListener("dragstart", (e) => {
                        if (pieceElement.draggable) {
                            draggedPiece = pieceElement; //jo variable humne declare kia tha , agr wo element draggable hai to usse 'draggedPiece namak variable meh save kr lenge    
                            sourceSquare = { row: rowindex, col: squareindex };//basically aap jab chaloge to.. kis row kis coloumn se chaloge wo bata raha hai
                            e.dataTransfer.setData("text/plain", "");
                        }
                    });

                    pieceElement.addEventListener("dragend", () => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });

                    squareElement.appendChild(pieceElement);// woh jo khali dabbe the unmme elemnts add karadiya
                }

                squareElement.addEventListener("dragover", (e) => {
                    e.preventDefault();  //kisi bhi humare square peh aap drag kar rhe hoto usse rok dia jayega(it won't work)
                });

                squareElement.addEventListener("drop", (e) => {
                    e.preventDefault();

                    if (draggedPiece) {     
                        const targetSquare = {      // eha humnne jo elements ko uthai unke location ko set kia 
                            row: parseInt(squareElement.dataset.row),
                            col: parseInt(squareElement.dataset.col)
                        };
                        handleMove(sourceSquare, targetSquare);// hum former se later pe target ko move kar rhe hai
                    }
                });

                boardElement.appendChild(squareElement);
            });
        });

        if (playerRole === 'b') {
            boardElement.classList.add('flipped');
        } else {
            boardElement.classList.remove('flipped');
        }
    };

    const handleMove = (source, target) => {
        const move = {
            from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
            to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
            promotion: "q",
        };

        console.log(`Player ${playerRole} moving from ${move.from} to ${move.to}`);
        if (chess.move(move)) {
            socket.emit("move", move);
            renderBoard();
        } else {
            console.log('Invalid move');
        }
    };

    const getPieceUnicode = (piece) => {
        const unicodePieces = {
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        };
        return unicodePieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()] || "";
    };

    // Socket client side
    socket.on("playerRole", function (role) {
        console.log(`Assigned role: ${role}`);
        playerRole = role;
        renderBoard();
    });

    socket.on("spectatorRole", function () {
        playerRole = null;
        renderBoard();
    });

    socket.on("boardState", function (fen) {
        console.log(`Board state updated: ${fen}`);
        chess.load(fen);
        renderBoard();
    });

    socket.on("move", function (move) {
        console.log(`Move received: ${move.from} to ${move.to}`);
        chess.move(move);
        renderBoard();
    });

    renderBoard(); // Call the function to render the board initially
});
