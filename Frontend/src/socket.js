import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to CodeSync Server!");
    console.log("Socket ID:", socket.id);
});

socket.on("connect_error", (error) => {
    console.log("Connection Error:", error.message);
});

export default socket;