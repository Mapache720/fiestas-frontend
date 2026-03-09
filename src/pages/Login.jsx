import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  // Estados para capturar lo que el usuario escribe
  const [credenciales, setCredenciales] = useState({
    usuario: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Función para actualizar el estado cuando se escribe en los inputs
  const handleChange = (e) => {
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value
    });
  };

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos
    
    try {
      // Hacemos la petición POST a nuestro servidor Node
      const response = await fetch('https://fiestas-backend.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credenciales), // Enviamos usuario y password
      });

      const data = await response.json();

      if (data.success) {
        // Si el login es exitoso, guardamos los datos del usuario (id, rol, nombre) en localStorage
        localStorage.setItem('usuarioFiestas', JSON.stringify(data.user));
        
        // Redirigimos dinámicamente según el rol que nos devolvió la Base de Datos
        navigate(`/${data.user.rol}`);
      } else {
        // Si falla (credenciales incorrectas), mostramos el mensaje que manda el backend
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor. ¿Está encendido Node?');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        {/* Un pequeño icono/logo de playa improvisado */}
        <h1 style={{ color: 'var(--playa-mar)', marginBottom: '5px' }}>🌊 Fiestas</h1>
        <h3 style={{ marginTop: '0', color: 'var(--texto-oscuro)' }}>Restaurante de Playa</h3>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
          <div style={{ textAlign: 'left' }}>
            <label><strong>Usuario</strong></label>
            <input 
              type="text" 
              name="usuario"
              className="input-field"
              placeholder="Ej: admin, mozo o cocina" 
              value={credenciales.usuario}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label><strong>Contraseña</strong></label>
            <input 
              type="password" 
              name="password"
              className="input-field"
              placeholder="Usa '123' para probar" 
              value={credenciales.password}
              onChange={handleChange}
              required 
            />
          </div>

          {error && <p style={{ color: 'red', margin: '0 0 15px 0' }}>{error}</p>}

          <button type="submit" className="btn-primary">
            Ingresar al Sistema
          </button>
        </form>

      </div>
    </div>
  );
}