import { io } from "socket.io-client";

const socket = io("https://codesync-ysdv.onrender.com");

socket.on("connect", () => {
    console.log("Connected to CodeSync Server!");
    console.log("Socket ID:", socket.id);
});

socket.on("connect_error", (error) => {
    console.log("Connection Error:", error.message);
});

export default socket;