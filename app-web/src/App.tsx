// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CreateRule from "./pages/CreateRule";

function App() {
  return (
    <Routes>
      {/* Login page at root */}
      <Route path="/" element={<LoginPage />} />

      {/* Panorama page */}
      <Route path="/CreateRule" element={<CreateRule />} />

      {/* Fallback: any unknown route redirects to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;