import Peer from "simple-peer";
import socket from "../socket";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSubmit } from "react-router-dom";
import EditorBox from "@monaco-editor/react";
import "./Editor.css";


function Editor() {
    const navigate = useNavigate();
    const location = useLocation();

    const username = location.state?.username || "Guest";
    const roomId = location.state?.roomId || "No Room ID";

    const [activeTab, setActiveTab] = useState("html");
    const [html, setHtml] = useState(
        "<h1>Hello, CodeSync!</h1>\n<p>My first project.</p>"
    );

    const [css, setCss] = useState(
        "body {\n font-family: Arial;\n padding: 20px;\n color: #345;\n}"
    );

    const [js, setJs] = useState(
        "console.log('Welcome to CodeSync!');"
    );

    const [runCode, setRunCode] = useState(false);

    const codeMap = {
        html: html,
        css: css,
        javascript: js,
    };

    const [localStream, setLocalStream] = useState(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [callError, setCallError] = useState("");
    const [callNotification, setCallNotification] = useState("");

    const localVideoRef = useRef(null);

    const [remoteStreams, setRemoteStreams] = useState([]);

    const peersRef = useRef([]);
    const localStreamRef = useRef(null);


    function updatedCode(value) {
        const newCode = value ?? "";

        console.log("Sending code:", roomId, activeTab);

        socket.emit("code-change", {
            roomId,
            code: newCode,
            language: activeTab,
        });

        if (activeTab === "html") {
            setHtml(newCode);
        } else if (activeTab === "css") {
            setCss(newCode);
        } else if (activeTab === "javascript") {
            setJs(newCode);
        }
    }


    useEffect(() => {
        socket.emit("join-room", roomId);

        function handleCodeUpdate({ code, language }) {
            console.log("Code update received:", language);

            if (language === "html") {
                setHtml(code);
            } else if (language === "css") {
                setCss(code);
            } else if (language === "javascript") {
                setJs(code);
            }
        }

        socket.on("code-update", handleCodeUpdate);

        function handleInitialCode(code) {
            setHtml(code.html);
            setCss(code.css);
            setJs(code.javascript);
        }

        socket.on("initial-code", handleInitialCode);

        return () => {
            socket.off("code-update", handleCodeUpdate);
        };
    }, [roomId]);


    function downloadCode() {
        const project = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <style>${css}</style>
        </head>
        <body>
        ${html}
        <script>${js}<\/script>
        </body>
        </html>`;

        const blob = new Blob([project], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "codesync-project.html";
        link.click();

        URL.revokeObjectURL(url);
    }

    const previewDocument = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>
${html}
<script>${js}<\/script>
</body>
</html>`;



    function createPeer(userToSignal, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            console.log("Sending signal to:", userToSignal, signal);

            socket.emit("video-signal", {
                targetId: userToSignal,
                signal,
                roomId,
            });
        });


        peer.on("connect", () => {
            console.log("Peer connected:", userToSignal);
        });

        peer.on("error", (err) => {
            console.error("Peer error:", err);
        });

        peer.on("stream", (remoteStream) => {
            setRemoteStreams((prev) => {
                if (prev.some((item) => item.peerId === userToSignal)) {
                    return prev;
                }

                return [
                    ...prev,
                    { peerId: userToSignal, stream: remoteStream },
                ];
            });
        });

        peersRef.current.push({
            peerId: userToSignal,
            peer,
        });

        return peer;
    }

    function addPeer(incomingSignal, callerId, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            console.log("Sending response signal to:", callerId, signal);

            socket.emit("video-signal", {
                targetId: callerId,
                signal,
                roomId,
            });
        });

        peer.on("connect", () => {
            console.log("Peer connected:", callerId);
        });

        peer.on("error", (err) => {
            console.error("Peer error:", err);
        });

        peer.on("stream", (remoteStream) => {
            setRemoteStreams((prev) => {
                if (prev.some((item) => item.peerId === callerId)) {
                    return prev;
                }

                return [
                    ...prev,
                    { peerId: callerId, stream: remoteStream },
                ];
            });
        });

        peer.signal(incomingSignal);

        peersRef.current.push({
            peerId: callerId,
            peer,
        });

        return peer;
    }


    useEffect(() => {
        function handleVideoCallUsers(userIds) {
            const stream = localStreamRef.current;

            if (!stream) return;

            userIds.forEach((userId) => {
                const alreadyConnected = peersRef.current.some(
                    (item) => item.peerId === userId
                );

                if (!alreadyConnected && userId !== socket.id) {
                    createPeer(userId, stream);
                }
            });
        }


        function handleVideoCallUserJoined(user) {
            console.log(`${user.username} joined the call`);

            setCallNotification(`${user.username} joined the call`);
            setTimeout(() => setCallNotification(""), 3000);
        }


        function handleVideoSignal({ senderId, signal }) {
            console.log("Received signal from:", senderId, signal);

            const existingPeer = peersRef.current.find(
                (item) => item.peerId === senderId
            );

            if (existingPeer) {
                existingPeer.peer.signal(signal);
            } else if (localStreamRef.current) {
                addPeer(signal, senderId, localStreamRef.current);
            }
        }


        function handleVideoCallUsers(users) {
            const stream = localStreamRef.current;

            if (!stream) return;

            users.forEach((user) => {
                const userId = user.socketId;

                const alreadyConnected = peersRef.current.some(
                    (item) => item.peerId === userId
                );

                if (!alreadyConnected && userId !== socket.id) {
                    createPeer(userId, stream);
                }
            });
        }

        
        function handleVideoCallUserLeft(user) {
            const userId = typeof user === "string" ? user : user.socketId;

            const username =
                typeof user === "string" ? "Participant" : user.username;

            console.log(`${username} left the call`);

            setCallNotification(`${username} left the call`);

            setTimeout(() => {
                setCallNotification("");
            }, 3000);

            const existingPeer = peersRef.current.find(
                (item) => item.peerId === userId
            );

            if (existingPeer) {
                existingPeer.peer.destroy();

                peersRef.current = peersRef.current.filter(
                    (item) => item.peerId !== userId
                );
            }

            setRemoteStreams((prev) =>
                prev.filter((item) => item.peerId !== userId)
            );
        }


        socket.on("video-call-users", handleVideoCallUsers);
        socket.on("video-call-user-joined", handleVideoCallUserJoined);
        socket.on("video-signal", handleVideoSignal);
        socket.on("video-call-user-left", handleVideoCallUserLeft);

        return () => {
            socket.off("video-call-users", handleVideoCallUsers);
            socket.off("video-call-user-joined", handleVideoCallUserJoined);
            socket.off("video-signal", handleVideoSignal);
            socket.off("video-call-user-left", handleVideoCallUserLeft);
        };
    }, [roomId]);


    //StartVideoCall
    async function startVideoCall() {
        try {
            setCallError("");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setLocalStream(stream);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            console.log("Joining video call room:", roomId);
            socket.emit("join-video-call", {
                roomId,
                username,
            });

        } catch (error) {
            console.error("Camera/Mic error:", error);
            setCallError(
                "Camera/microphone access nahi mila. Browser permissions check karo."
            );
        }
    }

    //ToggleMic
    function toggleMic() {
        if (!localStream) return;

        const newMicState = !micOn;

        localStream.getAudioTracks().forEach((track) => {
            track.enabled = newMicState;
        });

        setMicOn(newMicState);
    }

    //ToggleCamera
    function toggleCamera() {
        if (!localStream) return;

        const newCameraState = !cameraOn;

        localStream.getVideoTracks().forEach((track) => {
            track.enabled = newCameraState;
        });

        setCameraOn(newCameraState);
    }

    //stopVideoCall
    function stopVideCall() {
        // Notify other users before leaving
        socket.emit("leave-video-call", roomId);

        // Stop camera and microphone
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
        }

        // Destroy every peer connection
        peersRef.current.forEach(({ peer }) => {
            peer.destroy();
        });

        peersRef.current = [];

        // Clear local and remote videos
        localStreamRef.current = null;
        setLocalStream(null);
        setRemoteStreams([]);

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        setMicOn(true);
        setCameraOn(true);

        console.log("You left the video call");
    }


    return (
        <div className="editor-page">
            <header className="editor-navbar">

                <div className="room-info">
                    <span>Room ID: {roomId}</span>&nbsp;
                    <span>User: {username}</span>
                </div>

                <button className="back-btn" onClick={() => navigate("/")}>
                    ← Home
                </button>

                <h2>Code<span>Sync.</span></h2>

                <div className="editor-actions">
                    <button
                        className="download-btn"
                        onClick={downloadCode}
                    >
                        Download
                    </button>

                    <button
                        className="run-btn"
                        onClick={() => setRunCode(true)}
                    >
                        ▶ Run code
                    </button>
                </div>

            </header>

            <div className="workspace">
                <section className="code-section">
                    <div className="tabs">
                        <button
                            className={activeTab === "html" ? "active" : ""}
                            onClick={() => setActiveTab("html")}
                        >
                            HTML
                        </button>

                        <button
                            className={activeTab === "css" ? "active" : ""}
                            onClick={() => setActiveTab("css")}
                        >
                            CSS
                        </button>

                        <button
                            className={activeTab === "javascript" ? "active" : ""}
                            onClick={() => setActiveTab("javascript")}
                        >
                            JavaScript
                        </button>
                    </div>

                    <EditorBox
                        height="65vh"
                        language={activeTab === "javascript" ? "javascript" : activeTab}
                        theme="vs-dark"
                        value={codeMap[activeTab]}
                        onChange={updatedCode}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                        }}
                    />
                </section>

                <section className="preview-section">
                    <div className="preview-toolbar">
                        <span>Live Preview</span>
                        <span className="preview-status">
                            {runCode ? "Updated" : "Ready to run"}
                        </span>
                    </div>

                    <iframe
                        title="Code output preview"
                        className="preview-frame"
                        sandbox="allow-scripts"
                        srcDoc={runCode ? previewDocument : "<h3>Click Run Code to see your output.</h3>"}
                    />
                </section>
            </div>

            {/* VIDEO-CALL */}
            <section className="video-call-panel">
                <h2>CodeSync Video Call</h2>

                {callNotification && (
                    <p className="call-notification">{callNotification}</p>
                )}

                {/* Admin ki video */}
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="local-video"
                />

                {/* Admin btns */}
                {callError && <p className="call-error">{callError}</p>}

                {!localStream ? (
                    <button onClick={startVideoCall}>
                        Join Video Call
                    </button>
                ) : (
                    <>
                        <button onClick={toggleMic}>
                            {micOn ? "Mute Mic" : "Unmute Mic"}
                        </button>

                        <button onClick={toggleCamera}>
                            {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                        </button>

                        <button onClick={stopVideCall}>
                            Leave Call
                        </button>
                    </>
                )}


                {/* Remote users' videos */}
                <div className="remote-videos">
                    {remoteStreams.map((item) => (
                        <RemoteVideo
                            key={item.peerId}
                            stream={item.stream}
                        />
                    ))}
                </div>
            </section>

        </div>

    );
}

function RemoteVideo({ stream }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="remote-video"
        />
    );
}


export default Editor;