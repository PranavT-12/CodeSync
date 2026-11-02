import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [isSignup, setIsSignup] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");


    function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        const cleanEmail = email.trim().toLowerCase();

        if (!name.trim() && isSignup) {
            setMessage("Please enter your name.");
            return;
        }

        if (!cleanEmail || !password) {
            setMessage("Please fill in all required fields.");
            return;
        }

        if (isSignup) {
            // Create a new demo profile
            const existingUser = localStorage.getItem("codesyncUser");

            if (existingUser) {
                const savedUser = JSON.parse(existingUser);

                if (savedUser.email === cleanEmail) {
                    setMessage("Profile already exists. Please login.");
                    setIsSignup(false);
                    return;
                }

                setMessage("A demo profile already exists in this browser.");
                return;
            }

            const user = {
                name: name.trim(),
                email: cleanEmail,
                joined: new Date().toLocaleDateString(),
            };

            localStorage.setItem("codesyncUser", JSON.stringify(user));
            localStorage.removeItem("codesyncLoggedIn");

            // After signup, go to Login mode
            setName("");
            setEmail(cleanEmail);
            setPassword("");
            setIsSignup(false);
            setMessage("Profile created successfully! Please login.");
        } else {
            // Login with the saved demo profile
            const savedUser = localStorage.getItem("codesyncUser");

            if (!savedUser) {
                setMessage("No profile found. Please Sign Up first.");
                setIsSignup(true);
                return;
            }

            const user = JSON.parse(savedUser);

            if (user.email !== cleanEmail) {
                setMessage("Email does not match the saved profile.");
                return;
            }

            localStorage.setItem("codesyncLoggedIn", "true");

            // Successful login goes to Home
            navigate("/", {
                state: {
                    authMessage: "Login Successfully!"
                }
            });
        }
    }

return (
    <div className="login-page">
        <button
            className="login-back"
            onClick={() => navigate("/")}
        >
            ← Back to Home
        </button>

        <div className="login-card">
            <h1>Code<span>Sync.</span></h1>
            <h2
            >
                {isSignup ? "Create your profile" : "Welcome back!"}
            </h2>

            <p className="login-subtitle">
                {isSignup
                    ? "Join CodeSync and start coding."
                    : "Login to view your profile."}
            </p>

            <form onSubmit={handleSubmit}>
                {isSignup && (
                    <div className="login-field">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="login-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="password">password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {message && <p className="login-message">{message}</p>}

                <button className="login-submit" type="submit">
                    {isSignup ? "Create Profile" : "Login"}
                </button>
            </form>

            <p className="login-switch">
                {isSignup ? "Already have a profile?" : "New to CodeSync?"}{" "}

                <button
                    type="button"
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setMessage("");
                    }}
                >
                    {isSignup ? "Login" : "Sign Up"}
                </button>
            </p>
        </div>
    </div>
);
}

export default Login;