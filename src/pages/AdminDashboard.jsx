import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- DICCIONARIO DE PRESENTACIONES DINÁMICAS ---
const presentacionesPorTipo = {
  plato: ['Personal', 'Familiar'],
  cerveza: ['Botella Normal', 'Personal', 'Lata'],
  gaseosa: ['Personal', '1 litro', '2 1/4 litros', '3 litros']
};

const formatearNombre = (texto) => {
  return texto
    .split(' ') 
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)) 
    .join(' '); 
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tabActivo, setTabActivo] = useState('carta'); 

  // ================= ESTADOS =================
  const [carta, setCarta] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ nombre: '', tipo: 'plato', presentacion: presentacionesPorTipo['plato'][0], descripcion: '', precio: '' });
  const [itemEditando, setItemEditando] = useState(null); 

  const [periodo, setPeriodo] = useState('mes');
  const [ganancias, setGanancias] = useState({ detalles: [], totalGeneral: 0 });
  const [comandasCompletadas, setComandasCompletadas] = useState([]);
  const [filtroMozo, setFiltroMozo] = useState('todos');

  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre_usuario: '', password: '', rol: 'mozo' });
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // ================= EFECTOS =================
  useEffect(() => {
    if (tabActivo === 'carta') cargarCarta();
    if (tabActivo === 'ganancias') {
      cargarGanancias();
      cargarComandasCompletadas();
    }
    if (tabActivo === 'usuarios') cargarUsuarios();
  }, [tabActivo, periodo]);

  // ================= FUNCIONES CARTA =================
  const cargarCarta = async () => {
    const res = await fetch('https://fiestas-backend.onrender.com/api/carta');
    setCarta(await res.json());
  };

  const handleAgregarItem = async (e) => {
    e.preventDefault();
    await fetch('https://fiestas-backend.onrender.com/api/carta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoItem)
    });
    setNuevoItem({ nombre: '', tipo: 'plato', presentacion: presentacionesPorTipo['plato'][0], descripcion: '', precio: '' });
    cargarCarta();
  };

  const guardarEdicionCarta = async (e) => {
    e.preventDefault();
    await fetch(`https://fiestas-backend.onrender.com/api/carta/${itemEditando.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemEditando)
    });
    setItemEditando(null); 
    cargarCarta();
  };

  const eliminarPlato = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este producto de la carta?')) {
      const res = await fetch(`https://fiestas-backend.onrender.com/api/carta/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) alert(data.error);
      cargarCarta();
    }
  };

  // ================= FUNCIONES GANANCIAS =================
  const cargarGanancias = async () => {
    const res = await fetch(`https://fiestas-backend.onrender.com/api/ganancias?periodo=${periodo}`);
    setGanancias(await res.json());
  };

  const cargarComandasCompletadas = async () => {
    const res = await fetch('https://fiestas-backend.onrender.com/api/admin/comandas-completadas');
    setComandasCompletadas(await res.json());
  };

  const comandasFiltradas = filtroMozo === 'todos'
    ? comandasCompletadas
    : comandasCompletadas.filter(c => c.mozo === filtroMozo);

  const mozosUnicos = [...new Set(comandasCompletadas.map(c => c.mozo))];

  // ================= FUNCIONES USUARIOS =================
  const cargarUsuarios = async () => {
    try {
      const res = await fetch('https://fiestas-backend.onrender.com/api/usuarios');
      const data = await res.json();
      // PROTECCIÓN: Nos aseguramos de que siempre sea un array
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setUsuarios([]);
    }
  };

  const handleAgregarUsuario = async (e) => {
    e.preventDefault();
    const res = await fetch('https://fiestas-backend.onrender.com/api/usuarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoUsuario)
    });
    const data = await res.json();
    if (data.success) {
      setNuevoUsuario({ nombre_usuario: '', password: '', rol: 'mozo' });
      await cargarUsuarios();
    } else alert(data.message);
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    await fetch(`https://fiestas-backend.onrender.com/api/usuarios/${usuarioEditando.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(usuarioEditando)
    });
    setUsuarioEditando(null);
    cargarUsuarios();
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este usuario?')) {
      const res = await fetch(`https://fiestas-backend.onrender.com/api/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) alert(data.error);
      cargarUsuarios();
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioFiestas');
    navigate('/login');
  };

  // ================= RENDERIZADO =================
  return (
    <div className="container" style={{ position: 'relative' }}>

      {/* --- CABECERA --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'var(--playa-mar)' }}>Panel de Administración 🌊</h1>
        <button onClick={cerrarSesion} style={{ padding: '8px 15px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cerrar Sesión</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn-primary" style={{ backgroundColor: tabActivo === 'carta' ? 'var(--playa-mar)' : '#ccc' }} onClick={() => setTabActivo('carta')}>Gestión de Carta</button>
        <button className="btn-primary" style={{ backgroundColor: tabActivo === 'ganancias' ? 'var(--playa-mar)' : '#ccc' }} onClick={() => setTabActivo('ganancias')}>Ganancias y Comandas</button>
        <button className="btn-primary" style={{ backgroundColor: tabActivo === 'usuarios' ? 'var(--playa-mar)' : '#ccc' }} onClick={() => setTabActivo('usuarios')}>Gestión de Usuarios</button>
      </div>

      {/* --- PESTAÑA 1: CARTA --- */}
      {tabActivo === 'carta' && (
        <div className="card">
          <h2>Agregar Nuevo Producto</h2>
          <form onSubmit={handleAgregarItem} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px', alignItems: 'center' }}>
            
            <input type="text" className="input-field" placeholder="Nombre (Ej: Ceviche)" value={nuevoItem.nombre} onChange={e => setNuevoItem({ ...nuevoItem, nombre: formatearNombre(e.target.value) })} required style={{ flex: '1.5', minWidth: '150px' }} />            
            <select className="input-field" value={nuevoItem.tipo} onChange={e => {
                const nuevoTipo = e.target.value;
                setNuevoItem({ 
                  ...nuevoItem, 
                  tipo: nuevoTipo, 
                  presentacion: presentacionesPorTipo[nuevoTipo][0] 
                });
              }} style={{ flex: '1', minWidth: '120px' }}>
              <option value="plato">Plato</option>
              <option value="cerveza">Cerveza</option>
              <option value="gaseosa">Gaseosa</option>
            </select>

            <select className="input-field" value={nuevoItem.presentacion} onChange={e => setNuevoItem({ ...nuevoItem, presentacion: e.target.value })} style={{ flex: '1', minWidth: '130px' }}>
              {presentacionesPorTipo[nuevoItem.tipo].map(opcion => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>

            <input type="text" className="input-field" placeholder="Descripción (Opcional)" value={nuevoItem.descripcion} onChange={e => setNuevoItem({ ...nuevoItem, descripcion: e.target.value })} style={{ flex: '2', minWidth: '150px' }} />
            <input type="number" step="0.10" className="input-field" placeholder="Precio (S/)" value={nuevoItem.precio} onChange={e => setNuevoItem({ ...nuevoItem, precio: e.target.value })} required style={{ flex: '0.8', minWidth: '80px' }} />
            <button type="submit" className="btn-primary" style={{ width: 'auto', marginTop: '-10px' }}>Agregar</button>
          </form>

          <h2>Carta Actual</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--playa-arena)', borderBottom: '2px solid var(--playa-mar)' }}>
                <th style={{ padding: '10px' }}>Tipo</th>
                <th style={{ padding: '10px' }}>Plato / Bebida</th>
                <th style={{ padding: '10px' }}>Precio</th>
                <th style={{ padding: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carta.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', textTransform: 'capitalize' }}>{item.tipo}</td>
                  <td style={{ padding: '10px' }}><strong>{item.nombre}</strong> <span style={{ color: 'var(--playa-mar)' }}>({item.presentacion})</span> <br /><small>{item.descripcion}</small></td>
                  <td style={{ padding: '10px' }}>S/ {item.precio}</td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => setItemEditando(item)} style={{ padding: '5px 10px', background: 'var(--playa-sol)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => eliminarPlato(item.id)} style={{ padding: '5px 10px', background: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- PESTAÑA 2: GANANCIAS Y COMANDAS --- */}
      {tabActivo === 'ganancias' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Reporte de Ingresos</h2>
              <select className="input-field" value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ width: '200px' }}>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mes</option>
                <option value="anio">Este Año</option>
                <option value="todo">Histórico Total</option>
              </select>
            </div>
            <div style={{ backgroundColor: 'var(--playa-celeste)', padding: '20px', borderRadius: '8px', textAlign: 'center', margin: '20px 0' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--texto-oscuro)' }}>Total Recaudado</h3>
              <h1 style={{ margin: '0', fontSize: '3rem', color: 'var(--playa-mar)' }}>S/ {ganancias.totalGeneral.toFixed(2)}</h1>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>Historial de Comandas Completadas</h2>
              <select className="input-field" value={filtroMozo} onChange={e => setFiltroMozo(e.target.value)} style={{ width: 'auto', margin: 0 }}>
                <option value="todos">Filtrar por Mozo (Todos)</option>
                {mozosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
              {comandasFiltradas.length === 0 ? <p>No hay comandas terminadas en el historial.</p> : null}
              {comandasFiltradas.map(c => (
                <div key={c.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', width: '300px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>Ticket #{c.id}</strong>
                    <span style={{ color: '#2a9d8f', fontWeight: 'bold' }}>✓ Pagado</span>
                  </div>
                  
                  <small style={{ color: '#666', display: 'block' }}>
                    📅 <strong>Fecha:</strong> {new Date(c.creado_en).toLocaleString('es-PE')}
                  </small>
                  <small style={{ color: '#666', display: 'block' }}>
                    👨‍🍳 <strong>Mozo:</strong> {c.mozo}
                  </small>
                  <small style={{ color: 'var(--playa-mar)', fontWeight: 'bold', display: 'block', marginTop: '5px' }}>
                    💳 Pago con: {c.metodo_pago ? c.metodo_pago.toUpperCase() : 'EFECTIVO'}
                  </small>
                  
                  <ul style={{ paddingLeft: '20px', fontSize: '0.9em', marginTop: '10px' }}>
                    {c.items.map((item, idx) => (
                      <li key={idx}>{item.cantidad}x {item.nombre} ({item.presentacion}) - S/{item.precio_unitario}</li>
                    ))}
                  </ul>
                  <h4 style={{ textAlign: 'right', margin: '10px 0 0 0', color: 'var(--playa-mar)' }}>Total: S/ {parseFloat(c.total).toFixed(2)}</h4>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- PESTAÑA 3: USUARIOS --- */}
      {tabActivo === 'usuarios' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: '1', minWidth: '300px' }}>
            <h2>Crear Usuario</h2>
            <form onSubmit={handleAgregarUsuario}>
              <label>Nombre de Usuario</label>
              <input type="text" className="input-field" value={nuevoUsuario.nombre_usuario} onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre_usuario: e.target.value })} required />
              <label>Contraseña</label>
              <input type="password" className="input-field" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} required />
              <label>Rol del Sistema</label>
              <select className="input-field" value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}>
                <option value="mozo">Mozo</option>
                <option value="cocina">Cocina</option>
              </select>
              <button type="submit" className="btn-primary">Registrar Usuario</button>
            </form>
          </div>

          <div className="card" style={{ flex: '2', minWidth: '400px' }}>
            <h2>Usuarios del Sistema</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--playa-arena)' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Usuario</th>
                  <th style={{ padding: '10px' }}>Rol</th>
                  <th style={{ padding: '10px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* PROTECCIÓN: Mensaje si no hay usuarios */}
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No hay mozos ni cocineros registrados todavía.
                    </td>
                  </tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{u.id}</td>
                      <td style={{ padding: '10px' }}><strong>{u.nombre_usuario}</strong></td>
                      <td style={{ padding: '10px', textTransform: 'capitalize' }}>{u.rol}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                        <button onClick={() => setUsuarioEditando({ id: u.id, nombre_usuario: u.nombre_usuario, rol: u.rol, password: '' })} style={{ padding: '5px 10px', background: 'var(--playa-sol)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => eliminarUsuario(u.id)} style={{ padding: '5px 10px', background: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Borrar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALES (Ventanas Flotantes) ================= */}

      {/* Modal Edición Carta */}
      {itemEditando && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <h2>Editar Producto</h2>
            <form onSubmit={guardarEdicionCarta}>
              
              <label>Nombre</label>
              <input type="text" className="input-field" value={itemEditando.nombre} onChange={e => setItemEditando({ ...itemEditando, nombre: formatearNombre(e.target.value) })} required />
              <label>Tipo</label>
              <select className="input-field" value={itemEditando.tipo} onChange={e => {
                  const nuevoTipo = e.target.value;
                  setItemEditando({ ...itemEditando, tipo: nuevoTipo, presentacion: presentacionesPorTipo[nuevoTipo][0] });
                }}>
                <option value="plato">Plato</option>
                <option value="cerveza">Cerveza</option>
                <option value="gaseosa">Gaseosa</option>
              </select>

              <label>Presentación</label>
              <select className="input-field" value={itemEditando.presentacion} onChange={e => setItemEditando({ ...itemEditando, presentacion: e.target.value })}>
                {presentacionesPorTipo[itemEditando.tipo] ? (
                  presentacionesPorTipo[itemEditando.tipo].map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))
                ) : (
                  <option value={itemEditando.presentacion}>{itemEditando.presentacion}</option>
                )}
              </select>

              <label>Descripción</label>
              <input type="text" className="input-field" value={itemEditando.descripcion} onChange={e => setItemEditando({ ...itemEditando, descripcion: e.target.value })} />
              
              <label>Precio (S/)</label>
              <input type="number" step="0.10" className="input-field" value={itemEditando.precio} onChange={e => setItemEditando({ ...itemEditando, precio: e.target.value })} required />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Guardar Cambios</button>
                <button type="button" className="btn-primary" style={{ backgroundColor: '#666' }} onClick={() => setItemEditando(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edición Usuario con PROTECCIÓN */}
      {usuarioEditando && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <h2>Editar Usuario</h2>
            <form onSubmit={guardarEdicionUsuario}>
              <label>Nombre de Usuario</label>
              <input type="text" className="input-field" value={usuarioEditando?.nombre_usuario || ''} onChange={e => setUsuarioEditando({ ...usuarioEditando, nombre_usuario: e.target.value })} required />
              <label>Nueva Contraseña <small>(Dejar en blanco para no cambiar)</small></label>
              <input type="password" className="input-field" placeholder="***" value={usuarioEditando?.password || ''} onChange={e => setUsuarioEditando({ ...usuarioEditando, password: e.target.value })} />
              <label>Rol</label>
              <select className="input-field" value={usuarioEditando?.rol || 'mozo'} onChange={e => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value })}>
                <option value="mozo">Mozo</option>
                <option value="cocina">Cocina</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Guardar Usuario</button>
                <button type="button" className="btn-primary" style={{ backgroundColor: '#666' }} onClick={() => setUsuarioEditando(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  width: '100%', maxWidth: '400px', padding: '30px', backgroundColor: 'white', borderRadius: '12px'
};