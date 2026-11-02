import { useNavigate, Navigate } from "react-router-dom";
import "./Profile.css";


function Profile() {

    const navigate = useNavigate();

    const savedUser = localStorage.getItem("codesyncUser");

    const user = savedUser ? JSON.parse(savedUser) : null;

    const isLoggedIn = localStorage.getItem("codesyncLoggedIn") === "true";


    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    function handleLogout() {
        localStorage.removeItem("codesyncLoggedIn");

        navigate("/", {
            state: {
                authMessage: "Logout Successfully!"
            }
        });
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h1>Profile Not Found</h1>
                    <p>Please sign up to create your profile.</p>

                    <button
                        onClick={() => navigate("/login")}
                        className="profile-primary-btn"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card">

                <button
                   className="profile-back-btn"
                   onClick={() => navigate("/")}
                >
                    ← Back to Home
                </button>

                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <h1>My Profile</h1>
                    <p className="profile-subtitle">
                        Manage your CodeSync account
                    </p>
                </div>

                <div className="profile-details">
                    <div className="profile-detail">
                        <label>Full Name</label>
                        <p>{user.name}</p>
                    </div>

                    <div className="profile-detail">
                        <label>Email Address</label>
                        <p>{user.email}</p>
                    </div>

                    <div className="profile-detail">
                        <label>Joined CodeSync</label>
                        <p>{user.joined || "Not available"}</p>
                    </div>
                </div>

                <button
                    className="profile-logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>
        </div>
    );

}

export default Profile;