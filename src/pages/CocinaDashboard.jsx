import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CocinaDashboard() {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [cocinero, setCocinero] = useState(null);
  
  // NUEVO: Estado para saber qué comanda se está confirmando
  const [comandaConfirmar, setComandaConfirmar] = useState(null); 

  const cargarComandas = async () => {
    try {
      const res = await fetch('https://fiestas-backend.onrender.com/api/cocina/comandas');
      const data = await res.json();
      setComandas(data);
    } catch (error) {
      console.error("Error al refrescar comandas:", error);
    }
  };

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioFiestas'));
    if (!usuarioGuardado || usuarioGuardado.rol !== 'cocina') {
      navigate('/login');
      return;
    }
    setCocinero(usuarioGuardado);
    cargarComandas();

    // Refresco cada 4 segundos
    const intervalo = setInterval(() => {
      cargarComandas();
    }, 4000);

    return () => clearInterval(intervalo);
  }, [navigate]);

  const cambiarEstado = async (id, nuevoEstado) => {
    await fetch(`https://fiestas-backend.onrender.com/api/comandas/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    setComandaConfirmar(null); // Cerramos el modal
    cargarComandas(); // Refrescamos la pantalla
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioFiestas');
    navigate('/login');
  };

  if (!cocinero) return <div>Cargando...</div>;

  return (
    <div className="container" style={{ maxWidth: '100%', padding: '20px', position: 'relative' }}>
      
      {/* Barra superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'var(--playa-mar)', padding: '15px 30px', borderRadius: '8px', color: 'white' }}>
        <h1 style={{ margin: 0 }}>🔥 Vista de Cocina en Vivo</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '1.2em' }}>👨‍🍳 {cocinero.nombre_usuario}</span>
          <button onClick={cerrarSesion} style={{ padding: '8px 15px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Salir
          </button>
        </div>
      </div>

      {/* Grid de Comandas */}
      {comandas.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: 'var(--texto-oscuro)' }}>No hay platos pendientes. ¡Buen trabajo! 🏖️</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
          
          {comandas.map(comanda => (
            <div key={comanda.id} className="card" style={{ 
              width: '320px', 
              borderTop: comanda.estado === 'pendiente' ? '8px solid var(--playa-sol)' : '8px solid var(--playa-mar)',
              backgroundColor: comanda.estado === 'preparando' ? '#f0f8ff' : 'white' 
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <h2 style={{ margin: 0 }}>Ticket #{comanda.id}</h2>
                <span style={{ 
                  backgroundColor: comanda.estado === 'pendiente' ? 'var(--playa-sol)' : 'var(--playa-mar)', 
                  color: comanda.estado === 'pendiente' ? 'black' : 'white', 
                  padding: '5px 10px', 
                  borderRadius: '15px', 
                  fontSize: '0.85em', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {comanda.estado}
                </span>
              </div>

              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#555' }}>
                🤵 Mozo: {comanda.mozo}
              </p>
              
              {/* Mostramos la nota si es que el mozo escribió alguna */}
              {comanda.nota && (
                <p style={{ margin: '0 0 15px 0', color: '#d62828', fontStyle: 'italic', fontSize: '0.9em' }}>
                  📌 Nota: {comanda.nota}
                </p>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 20px 0', minHeight: '120px' }}>
                {comanda.items.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '1.2em', padding: '8px 0', borderBottom: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong>{item.cantidad}x</strong> {item.nombre} <small style={{ color: '#666' }}>({item.presentacion})</small>
                    </span>
                    {/* Aquí mostramos el precio por cada elemento */}
                    <span style={{ color: 'var(--playa-mar)', fontWeight: 'bold', fontSize: '0.9em' }}>
                      S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              {comanda.estado === 'pendiente' ? (
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: 'var(--playa-mar)' }}
                  onClick={() => cambiarEstado(comanda.id, 'preparando')}
                >
                  Empezar a Preparar
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: '#2a9d8f' }} 
                  onClick={() => setComandaConfirmar(comanda.id)} // Abrimos el modal
                >
                  ¡Listo para Entregar! ✔️
                </button>
              )}

            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN ================= */}
      {comandaConfirmar && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <h2 style={{ marginTop: 0, color: 'var(--texto-oscuro)' }}>¿Confirmar entrega?</h2>
            <p>¿Estás seguro de que todos los platos de la <strong>Comanda #{comandaConfirmar}</strong> ya están listos para que el mozo los recoja?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => cambiarEstado(comandaConfirmar, 'completada')} className="btn-primary" style={{ backgroundColor: '#2a9d8f' }}>
                Sí, Entregar
              </button>
              <button onClick={() => setComandaConfirmar(null)} className="btn-primary" style={{ backgroundColor: '#666' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos para el Modal
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  width: '100%', maxWidth: '350px', padding: '30px', backgroundColor: 'white', borderRadius: '12px', textAlign: 'center'
};