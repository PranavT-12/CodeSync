const { Server } = require("socket.io");

const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {

    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const roomCodes = new Map();

app.get("/", (req, res) => {
    res.send("CodeSync Backend is Running!");
});

const PORT = 5000;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);


    //create-room code
    socket.on("create-room", (roomId) => {

        if (!roomCodes.has(roomId)) {
            roomCodes.set(roomId, {
                html: "<h1>Hello, Codeync!</h1>\n<p>My First Project.</p>",
                css: "body {\n font-family: Arial;\n padding: 20px;\n color: #345;\n}",
                javascript: "Console.log('Welcome to CodeSync!')",
            });
        }

        socket.join(roomId);

        console.log("Room created:", roomId);
    });


    //join code
    socket.on("join-room", (roomId) => {
        if (!roomCodes.has(roomId)) {
            socket.emit("room-error", "Room ID does not exist.");
            return;
        }

        socket.join(roomId);

        console.log("User joined room:", roomId);

        const savedCode = roomCodes.get(roomId);

        socket.emit("initial-code", savedCode);

        socket.emit("room-joined", roomId);
    });


    //code change
    socket.on("code-change", ({ roomId, code, language }) => {
        const currentCode = roomCodes.get(roomId);

        if (!currentCode) {
            return;
        }

        currentCode[language] = code;

        roomCodes.set(roomId, currentCode);

        socket.to(roomId).emit("code-update", {
            code,
            language,
        });
    });


    socket.on("join-video-call", ({ roomId, username }) => {
        if (!roomId || !roomCodes.has(roomId)) {
            socket.emit("video-call-error", "Room does not exist.");
            return;
        }

        const videoRoom = `video-${roomId}`;

        // Existing participants with their usernames
        const existingUsers = [
            ...(io.sockets.adapter.rooms.get(videoRoom) || []),
        ].map((socketId) => ({
            socketId,
            username: io.sockets.sockets.get(socketId)?.data.username || "Participant",
        }));

        // Save this participant's username
        socket.data.username = username || "Participant";

        // Join video room
        socket.join(videoRoom);

        // Send existing participants to the new user
        socket.emit("video-call-users", existingUsers);

        // Notify others about the new participant
        socket.to(videoRoom).emit("video-call-user-joined", {
            socketId: socket.id,
            username: socket.data.username,
        });

        console.log("Video call joined:", roomId, socket.id, socket.data.username);
    });


    socket.on("video-signal", ({ targetId, signal, roomId }) => {
        const videoRoom = `video-${roomId}`;

        // Only forward signals to users in the same video room
        const targetSocket = io.sockets.sockets.get(targetId);

        if (!targetSocket || !targetSocket.rooms.has(videoRoom)) {
            return;
        }

        io.to(targetId).emit("video-signal", {
            senderId: socket.id,
            signal,
            roomId,
        });
    });

    //Leave video call
    socket.on("leave-video-call", (roomId) => {
        if (!roomId) return;

        const videoRoom = `video-${roomId}`;

        // Notify everyone else that this user left
        socket.to(videoRoom).emit("video-call-user-left", socket.id);

        // Remove user from the video room
        socket.leave(videoRoom);

        console.log("Video call left:", roomId, socket.id);
    });


    //disconnect
    socket.on("disconnect", () => {
        for (const room of socket.rooms) {
            if (room.startsWith("video-")) {
                socket.to(room).emit("video-call-user-left", socket.id);
                console.log("Video user disconnected:", socket.id, room);
            }
        }
    });
});


server.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});

