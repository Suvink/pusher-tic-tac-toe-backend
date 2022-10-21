const express = require("express");
const cookieParser = require("cookie-parser");
const db = require('memory-cache');
const { uuid } = require('uuidv4');
const Pusher = require("pusher");
const cors = require("cors");

const PORT = 5000;

//Initialize Express App
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());

let usersArray = [];
let roomsArray = [];

const GAME_CHANNEL = "ttt-main-channel";

const pusher = new Pusher({
    appId: "1495168",
    key: "6e3853dc492a3ab9e11e",
    secret: "f1045856d704b8219b6b",
    cluster: "ap1",
    useTLS: true
});

app.get("/", (req, res) => {
    res.status(200).send("It works!");
});

app.post("/create", (req, res) => {
    const { name, socketId } = req.body;

    //Save user in the local storage
    const id = uuid();
    db.put(id, name);
    usersArray.push({
        id: id,
        name: name
    });

    console.log(usersArray)

    //Pusher Presence
    const presenceData = {
        user_id: id,
        user_info: { name: name },
    };

    //const authResponse = pusher.authorizeChannel(socketId, GAME_CHANNEL, presenceData);

    res.status(200).send({
        message: "success",
        data: {
            id: id
        }
    });
});

app.get("/getFreeUsers", (req, res) => {
    res.status(200).send({
        message: "success",
        data: {
            users: usersArray
        }
    });
});

app.post("/createRoom", (req, res) => {
    const { myId, opponentId } = req.body;
    const roomId = "room-" + uuid();
    dataObj = {
        myId: myId,
        opponentId: opponentId,
    }
    db.put(roomId, JSON.stringify(dataObj));
    roomsArray.push({
        ...dataObj,
        roomId: roomId
    })
    usersArray = usersArray.filter(e => e.id !== myId); //Remove myself from free users
    usersArray = usersArray.filter(e => e.id !== opponentId); //Remove Opponent from free users

    res.status(200).send({
        message: "success",
        data: {
            ...dataObj,
            roomId: roomId
        }
    });
});

pusher.trigger("my-channel", "my-event", {
    message: "hello world"
});

//Start the app and listen on PORT 5000
app.listen(PORT, () => {
    console.log(`Server Started at PORT ${PORT}`);
});