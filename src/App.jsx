import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
// ¡Aquí están las importaciones que faltaban!
import AdminDashboard from './pages/AdminDashboard';
import MozoDashboard from './pages/MozoDashboard';
import CocinaDashboard from './pages/CocinaDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Pantalla de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas por rol (por ahora públicas para pruebas) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/mozo" element={<MozoDashboard />} />
        <Route path="/cocina" element={<CocinaDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;