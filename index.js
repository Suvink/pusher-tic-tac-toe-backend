const express = require("express");
const cookieParser = require("cookie-parser");
const db = require('memory-cache');
const { uuid } = require('uuidv4');
const Pusher = require("pusher");
var randomstring = require("randomstring");
const cors = require("cors");
require("dotenv").config()

const PORT = 5000;

//Initialize Express App
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({ credentials: true, origin: true }));

let roomsArray = [];

console.log(process.env.PUSHER_KEY?.toString())

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID?.toString(),
    key: process.env.PUSHER_KEY?.toString(),
    secret: process.env.PUSHER_SECRET?.toString(),
    cluster: "ap1",
    useTLS: true
});

app.get("/", (req, res) => {
    res.status(200).send("It works!");
});

app.post("/create", (req, res) => {
    const { name } = req.body;

    //Save user in the local storage
    const id = uuid();
    db.put(id, name);

    res.status(200).send({
        message: "success",
        data: {
            name: name,
            id: id
        }
    });
});

app.post("/createRoom", (req, res) => {
    const { myId } = req.body;
    const roomId = randomstring.generate(6);

    tempRoom = {
        roomId: roomId,
        createdBy: myId,
        createdByName: db.get(myId),
    }

    roomsArray.push(tempRoom);

    res.status(200).send({
        message: "success",
        data: {
            ...tempRoom
        }
    });
});

app.post("/joinRoom", (req, res) => {
    const { myId, roomId } = req.body;

    //Find the temp room
    const tempRoom = roomsArray.find(room => room.roomId === roomId);
    //Create the permanant room
    const room = {
        ...tempRoom,
        joinedBy: myId,
        joinedByName: db.get(myId)
    }
    //Save in the db
    db.put(roomId, JSON.stringify(room));

    //Remove the temp room
    roomsArray = roomsArray.filter(e => e.roomId !== roomId); //Remove from the temp array

    //Trigger Pusher Event
    pusher.trigger(roomId, "user_joined", {
        data: room
    })

    res.status(200).send({
        message: "success",
        data: {
            ...room
        }
    });
});

app.post("/makeMove", (req, res) => {

    const { myId, roomId, board, xIsNext } = req.body;

    //Broadcase who made the first move
    let xcount = 0;
    board.map(el => {
        if (el === 'X') {
            xcount++;
        }
    });
    if (xcount === 1) {
        pusher.trigger(roomId, "first_move", {
            id: myId
        })
    }

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    }
    const winner = calculateWinner(board);

    let move = {
        playedBy: myId,
        roomId: roomId,
        board: board,
        xIsNext: xIsNext,
        winner: winner
    }

    //Trigger Pusher Event
    pusher.trigger(roomId, "new_move", {
        data: move
    });

    res.status(200).send({
        message: "success",
        data: {
            ...move
        }
    });
});

app.post("/getRoom", (req, res) => {
    const { roomId } = req.body;
    const room = db.get(roomId);
    res.status(200).send({
        message: "success",
        data: {
            room: JSON.parse(room)
        }
    });
})

//Start the app and listen on PORT 5000
app.listen(PORT, () => {
    console.log(`Server Started at PORT ${PORT}`);
});

// Export the Express API
module.exports = app;