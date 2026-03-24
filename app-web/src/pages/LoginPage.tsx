// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginToPanorama } from "../services/PanoramaLoginClient";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //const { setToken } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const bearerToken = await loginToPanorama(host, username, password);

      // Save token in shared auth context (and sessionStorage)
      //setToken(bearerToken);

      console.log("Bearer token (cleaned):", bearerToken);

      // Navigate to Panorama page on success
      navigate("/panorama");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Login failed");

      // Clear any existing token on error
      //setToken(null);
    } finally {
      setLoading(false);
    }
  }

  return (

    <div className="appTitle">
      <h1 className="AppTitle">Panorama IP Zone Mapper</h1>
      
      <div className="login-page">
        <h1 className="login-page__title">Login</h1>

        <form className="login-page__form" onSubmit={handleSubmit}>
          {/* Host field */}
          <div className="login-page__field">
            <label className="login-page__label" htmlFor="host">
              Host
            </label>
            <input
              id="host"
              className="login-page__input"
              type="text"
              placeholder="Website or IP Address"
              value={host}
              onChange={e => setHost(e.target.value)}
            />
          </div>

          {/* Username field */}
          <div className="login-page__field">
            <label className="login-page__label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="login-page__input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {/* Password field */}
          <div className="login-page__field">
            <label className="login-page__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="login-page__input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-page__button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="login-page__error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}