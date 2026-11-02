import socket from "../socket";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Home.css";


function Home() {
    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const [message, setMessage] = useState("");
    const [theme, setTheme] = useState("light");

    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [showSignupPopup, setShowSignupPopup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => localStorage.getItem("codesyncLoggedIn") === "true"
    );

    const [showAuthMessage, setShowAuthMessage] = useState("");

    const location = useLocation();

    const profileMenuRef = useRef(null);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target)
            ) {
                setProfileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);


    useEffect(() => {
        if (isLoggedIn) {
            setShowSignupPopup(false);
            return;
        }

        const interval = setInterval(() => {
            setShowSignupPopup(true);
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [isLoggedIn]);


    // logout
    useEffect(() => {
        if (!showAuthMessage) return;

        const timer = setTimeout(() => {
            setShowAuthMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [showAuthMessage]);


    // login msg
    useEffect(() => {
        if (location.state?.authMessage) {
            setShowAuthMessage(location.state.authMessage);

            navigate("/", { replace: true, state: {} });
        }
    }, [location.state, navigate]);


    function handleCreateRoom() {
        if (username.trim() === "") {
            setMessage("Please enter your name first.");
            return;
        }

        const newRoomId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();


        socket.emit("create-room", newRoomId);

        setRoomId(newRoomId);
        setMessage(`Room created! Your Room ID is ${newRoomId}`);
        navigate("/editor", {
            state: {
                username: username,
                roomId: newRoomId,
            },
        });
    }


    //Joined room function
    function handleJoinRoom() {
        if (username.trim() === "" || roomId.trim() === "") {
            setMessage("Please enter your name and Room ID.");
            return;
        }

        const enteredRoomId = roomId.trim().toUpperCase();

        function handleRoomJoined(joinedRoomId) {
            socket.off("room-joined", handleRoomJoined);
            socket.off("room-error", handleRoomError);

            setMessage(`Welcome ${username}! You joined Room ${joinedRoomId}.`);

            navigate("/editor", {
                state: {
                    username: username.trim(),
                    roomId: joinedRoomId,
                },
            });
        }

        function handleRoomError(message) {
            socket.off("room-joined", handleRoomJoined);
            socket.off("room-error", handleRoomError);

            setMessage(message);
        }

        socket.once("room-joined", handleRoomJoined);
        socket.once("room-error", handleRoomError);

        socket.emit("join-room", enteredRoomId);
    }


    function toggleTheme() {
        setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
        );
    }


    useEffect(() => {
        function handleRoomError(message) {
            setMessage(message);
        }

        socket.on("room-error", handleRoomError);

        return () => {
            socket.off("room-error", handleRoomError);
        };
    }, []);


    return (
        <div className={`home-page ${theme}`}>

            <nav className="navbar">
                <a href="#home" className="logo">
                    <span className="logo-icon">&lt;/&gt;</span>
                    CodeSync<span className="logo-dot">.</span>
                </a>

                <div className="nav-right">
                    <a href="#home">Home</a>
                    <a href="#features">Features</a>
                    <a href="#about">About</a>

                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                        title="Toggle theme"
                    >
                        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                    </button>

                    {/* USER PROFILE ICON */}
                    <div className="profile-menu-container" ref={profileMenuRef}>
                        <button
                            className="profile-icon-btn"
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            aria-label="Open profile menu"
                            aria-expanded={profileMenuOpen}
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                            </svg>
                        </button>

                        {profileMenuOpen && (
                            <div className="profile-dropdown">
                                <button
                                    onClick={() => {
                                        setProfileMenuOpen(false);
                                        navigate("/profile");
                                    }}
                                >
                                    My Profile
                                </button>



                                {isLoggedIn ? (
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("codesyncLoggedIn");
                                            localStorage.removeItem("codesyncUser");

                                            setIsLoggedIn(false);
                                            setProfileMenuOpen(false);
                                            setShowAuthMessage("Logout Successfully!");
                                        }}
                                    >
                                        Logout
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            navigate("/login");
                                        }}
                                    >
                                        Login
                                    </button>
                                )}


                            </div>
                        )}
                    </div>

                </div>
            </nav>


            <main id="home">
                <section className="hero">
                    <div className="hero-content">
                        <p className="eyebrow">
                            YOUR SPACE TO BUILD TOGETHER
                        </p>

                        <h1>
                            Code Together.
                            <br />
                            <span>Create Together.</span>
                        </h1>

                        <p className="hero-description">
                            A simple online code editor for writing code,
                            building projects, and collaborating with friends.
                        </p>

                        <div className="room-card">
                            <label htmlFor="username">Your Name</label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Enter your name"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    setMessage("");
                                }}
                            />

                            <button
                                className="create-btn"
                                onClick={handleCreateRoom}
                            >
                                + Create New Room
                            </button>

                            <div className="separator">
                                <span>OR JOIN AN EXISTING ROOM</span>
                            </div>

                            <label htmlFor="roomId">Room ID</label>

                            <input
                                id="roomId"
                                type="text"
                                placeholder="Enter Room ID"
                                value={roomId}
                                onChange={(event) => {
                                    setRoomId(event.target.value.toUpperCase());
                                    setMessage("");
                                }}
                            />

                            <button
                                className="join-btn"
                                onClick={handleJoinRoom}
                            >
                                Join Room →
                            </button>

                            {message && (
                                <p className="status-message" role="status">
                                    {message}
                                </p>
                            )}
                        </div>

                        <p className="hero-footer">
                            Built for learners, developers, and creative minds.
                        </p>
                    </div>


                    <div className="editor-visual" aria-label="Code editor preview">
                        <div className="editor-window">
                            <div className="window-header">
                                <div className="window-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span>CodeSync Editor</span>
                                <span className="online-status">● Ready</span>
                            </div>

                            <div className="editor-body">
                                <aside className="file-sidebar">
                                    <p>EXPLORER</p>
                                    <span className="file active">🌐 index.html</span>
                                    <span className="file">🎨 style.css</span>
                                    <span className="file">JS script.js</span>
                                </aside>

                                <div className="code-panel">
                                    <div className="code-tab">index.html</div>
                                    <pre>
                                        <code>
                                            <span className="code-purple">const</span>{" "}
                                            <span className="code-blue">app</span> = {"{"}
                                            {"\n"}  name: <span className="code-green">"CodeSync"</span>,
                                            {"\n"}  mode: <span className="code-green">"collaborative"</span>,
                                            {"\n"}  <span className="code-purple">start</span>() {"{"}
                                            {"\n"}    <span className="code-blue">return</span>{" "}
                                            <span className="code-green">"Let's build!"</span>;
                                            {"\n"}  {"}"}
                                            {"\n"}{"}"};
                                        </code>
                                    </pre>
                                </div>
                            </div>

                            <div className="preview-panel">
                                <div className="preview-heading">
                                    <span>● LIVE PREVIEW</span>
                                    <span>↗</span>
                                </div>

                                <div className="preview-content">
                                    <div className="preview-symbol">&lt;/&gt;</div>
                                    <h3>Hello, Developer!</h3>
                                    <p>Your next great idea starts here.</p>
                                    <div className="preview-button">Get Started →</div>
                                </div>
                            </div>
                        </div>

                        <div className="floating-badge">
                            <span className="badge-check">✓</span>
                            Made for collaboration
                        </div>
                    </div>
                </section>

                {/* FEATURE SECTION */}
                <section id="features" className="features-section">
                    <div className="section-heading">
                        <p className="eyebrow">WHAT WE OFFER</p>
                        <h2>Everything You Need to Code Better</h2>
                        <p>
                            Simple tools to help you write code, experiment with ideas,
                            and build projects together.
                        </p>
                    </div>

                    <div className="features">
                        <div className="feature-card">
                            <span className="feature-icon">⚡</span>
                            <h3>Real-time Collaboration</h3>
                            <p>
                                Work together with friends in a shared coding workspace.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">💻</span>
                            <h3>Online Code Editor</h3>
                            <p>
                                Write and test your code directly in your browser.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">▶</span>
                            <h3>Live Preview</h3>
                            <p>
                                See how your HTML, CSS, and JavaScript projects look.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">💾</span>
                            <h3>Save & Download</h3>
                            <p>
                                Save your work and download your code for later use.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ABOUT SECTION */}
                <section id="about" className="about-section">
                    <div className="about-content">
                        <p className="eyebrow">ABOUT CODESYNC</p>

                        <h2>Making Coding Better, Together.</h2>

                        <p>
                            CodeSync is a collaborative coding platform designed for
                            students, learners, and developers. Our goal is to make
                            coding practice easier by bringing code editing, project
                            experimentation, and collaboration into one workspace.
                        </p>

                        <p>
                            Whether you are learning web development, practising with
                            friends, or building your next project, CodeSync aims to
                            give you a simple place to turn your ideas into code.
                        </p>

                        <a href="#home" className="back-home-btn">
                            Back to Home ↑
                        </a>
                    </div>

                    <div className="about-visual">
                        <div className="about-code-icon">&lt;/&gt;</div>
                        <h3>Learn. Build. Collaborate.</h3>
                        <p>One workspace for your coding journey.</p>
                    </div>
                </section>

                <footer className="page-footer">
                    <p>CodeSync © 2026 — Code, learn, and create together.</p>
                </footer>

            </main>


            {showSignupPopup && (
                <div className="signup-popup-overlay">
                    <div className="signup-popup">
                        <button
                            className="signup-popup-close"
                            onClick={() => setShowSignupPopup(false)}
                        >
                            ×
                        </button>

                        <h2>Welcome to Code<span>Sync</span>!</h2>

                        <p>
                            Create your profile to get started with CodeSync.
                        </p>

                        <button
                            className="signup-popup-btn"
                            onClick={() => navigate("/login")}
                        >
                            Sign Up / Login
                        </button>
                    </div>
                </div>
            )}

            {showAuthMessage && (
                <div className="signup-popup-overlay">
                    <div className="signup-popup">
                        <h2>{showAuthMessage}</h2>
                        <p>
                            {isLoggedIn
                                ? "Welcome back to CodeSync!"
                                : "You have been logged out successfully."}
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Home;
