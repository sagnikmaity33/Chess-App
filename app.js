const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    if(!players.white){
        players.white = uniquesocket.id;  // Corrected here
        uniquesocket.emit("playerRole", "w");
        console.log("white player connected");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
        console.log("black player connected");
    } else {
        uniquesocket.emit("spectatorRole");  // Corrected here
    }

    uniquesocket.on("disconnect", function(){
        if (uniquesocket.id === players.white){
            delete players.white;
        } else if (uniquesocket.id === players.black){
            delete players.black;   
        }
    });




/*in simole words eha pe jo if statement dia gya hai woh bol raha hai ki == jab w ka turn ho to w ki ja ga aone agr agr b leke kahi or ralh di to ,,eoh return kar dega, matlb jaha peh tha wohi peh ake rakh dega keu ki return hai */

/*eha pe jo 'chess' word use kia gya hai woh lready info deta ha ki kis ka turn hai ... and jo turn word hai woh bata ta hai kiska turn chak raha hai   */


    uniquesocket.on("move", (move) => {
        // try {
        //     if ((chess.turn() === "w" && uniquesocket.id !== players.white) || 
        //         (chess.turn() === "b" && uniquesocket.id !== players.black)) {   
        //         console.log("It's not your turn!");
        //         return;
        //     }
        //     const result = chess.move(move);
        //     if (result) {
        //         currentPlayer = chess.turn();
        //         io.emit("move", move);
        //         io.emit("boardState", chess.fen());
        //     } else {
        //         console.log("Invalid move: ", move);
        //         uniquesocket.emit("invalidMove", move);
        //     }
        // } 
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return; // Corrected here
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return; // Corrected here

            const result = chess.move(move);
            if(result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
                
                if (chess.isGameOver()) {
                    io.emit("gameOver", { winner: chess.turn() === 'w' ? 'b' : 'w' });
                }
            } else {
                console.log("Invalid move: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        }
        catch (err) {
            console.log(err);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, function () {
    console.log('Server is running on port 3000');
});

