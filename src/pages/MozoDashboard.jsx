import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PlatoCard = ({ plato, onAgregar }) => {
  const [idSeleccionado, setIdSeleccionado] = useState(plato.variaciones[0].id);
  const [cantidad, setCantidad] = useState(1);

  // NUEVO: Si la carta se filtra y el plato cambia, reseteamos el ID a la primera opción válida
  useEffect(() => {
    setIdSeleccionado(plato.variaciones[0].id);
  }, [plato.nombre]);

  // PROTECCIÓN: Si por alguna razón no lo encuentra, toma el primero por defecto
  const variacionActual = plato.variaciones.find(v => v.id == idSeleccionado) || plato.variaciones[0];

  const handleAgregar = () => {
    if (!variacionActual) return; // Escudo extra
    onAgregar(variacionActual, cantidad);
    setCantidad(1);
  };

  return (
    <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'var(--playa-arena)' }}>
      <h3 style={{ margin: '0 0 5px 0', color: 'var(--playa-mar)' }}>{plato.nombre}</h3>
      <small style={{ color: '#555' }}>{plato.descripcion}</small>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select className="input-field" style={{ margin: 0, flex: 2, padding: '8px' }} value={idSeleccionado} onChange={e => setIdSeleccionado(e.target.value)}>
          {plato.variaciones.map(v => (
            <option key={v.id} value={v.id}>{v.presentacion} - S/ {v.precio}</option>
          ))}
        </select>
        <input type="number" min="1" className="input-field" style={{ margin: 0, flex: 1, padding: '8px' }} value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} />
        <button className="btn-primary" style={{ flex: 1, padding: '10px' }} onClick={handleAgregar}>Añadir</button>
      </div>
    </div>
  );
};

export default function MozoDashboard() {
  const navigate = useNavigate();
  const [mozo, setMozo] = useState(null);
  const [tabActivo, setTabActivo] = useState('nueva');

  // Datos y Filtros
  const [cartaAgrupada, setCartaAgrupada] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // NUEVO FILTRO

  // Carrito y Edición
  const [carrito, setCarrito] = useState([]);
  const [notaComanda, setNotaComanda] = useState(''); // NUEVA NOTA
  const [comandaTarget, setComandaTarget] = useState(null); // Para saber si editamos una orden

  const [misComandas, setMisComandas] = useState([]);

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioFiestas'));
    if (!usuarioGuardado || usuarioGuardado.rol !== 'mozo') navigate('/login');
    else { setMozo(usuarioGuardado); cargarCartaAgrupada(); }
  }, []);

  useEffect(() => { if (tabActivo === 'mis_comandas' && mozo) cargarMisComandas(); }, [tabActivo, mozo]);

  const cargarCartaAgrupada = async () => {
    const res = await fetch('https://fiestas-backend.onrender.com/api/carta');
    const data = await res.json();
    const agrupado = data.reduce((acc, item) => {
      if (!acc[item.nombre]) acc[item.nombre] = { nombre: item.nombre, descripcion: item.descripcion, variaciones: [] };
      acc[item.nombre].variaciones.push(item);
      return acc;
    }, {});
    setCartaAgrupada(Object.values(agrupado));
  };

  const cargarMisComandas = async () => {
    const res = await fetch(`https://fiestas-backend.onrender.com/api/mozo/comandas/${mozo.id}`);
    setMisComandas(await res.json());
  };

  const agregarAlCarrito = (variacion, cant) => {
    if (!variacion) return;
    const itemExistente = carrito.find(item => item.item_id == variacion.id);
    if (itemExistente) {
      setCarrito(carrito.map(item =>
        item.item_id == variacion.id ? { ...item, cantidad: item.cantidad + cant } : item
      ));
    } else {
      setCarrito([...carrito, {
        item_id: variacion.id, nombre: variacion.nombre, presentacion: variacion.presentacion, precio_unitario: variacion.precio, cantidad: cant
      }]);
    }
  };

  const quitarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  // NUEVO: Restar 1 en el carrito (antes de enviar)
  const disminuirDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    if (nuevoCarrito[index].cantidad > 1) {
      nuevoCarrito[index].cantidad -= 1;
    } else {
      nuevoCarrito.splice(index, 1);
    }
    setCarrito(nuevoCarrito);
  };

  // NUEVO: Restar 1 en una orden ya enviada
  const disminuirUnPlato = async (detalle_id) => {
    await fetch(`https://fiestas-backend.onrender.com/api/detalles_comanda/${detalle_id}/disminuir`, { method: 'PUT' });
    cargarMisComandas();
  };

  const procesarComanda = async () => {
    if (carrito.length === 0) return alert('El carrito está vacío');

    if (comandaTarget) {
      // AGREGAR A UNA COMANDA EXISTENTE
      await fetch(`https://fiestas-backend.onrender.com/api/comandas/${comandaTarget}/agregar-items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: carrito })
      });
      alert(`Productos agregados a la Comanda #${comandaTarget}`);
      setComandaTarget(null);
    } else {
      // CREAR COMANDA NUEVA
      await fetch('https://fiestas-backend.onrender.com/api/comandas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mozo_id: mozo.id, nota: notaComanda, items: carrito })
      });
      alert('Comanda nueva enviada a cocina');
    }

    setCarrito([]); setNotaComanda(''); setTabActivo('mis_comandas');
  };

  const iniciarEdicionComanda = (id) => {
    setComandaTarget(id);
    setCarrito([]);
    setTabActivo('nueva');
  };

  const cancelarEdicion = () => {
    setComandaTarget(null);
    setCarrito([]);
  };

  const eliminarComandaEntera = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar toda la comanda?')) {
      await fetch(`https://fiestas-backend.onrender.com/api/comandas/${id}`, { method: 'DELETE' });
      cargarMisComandas();
    }
  };

  const eliminarPlatoDeComanda = async (detalle_id) => {
    if (window.confirm('¿Quitar este plato de la orden?')) {
      await fetch(`https://fiestas-backend.onrender.com/api/detalles_comanda/${detalle_id}`, { method: 'DELETE' });
      cargarMisComandas();
    }
  };

  const registrarPago = async (id) => {
    const metodo = document.getElementById(`pago-${id}`).value;
    if (window.confirm(`¿Confirmar pago por S/ ${misComandas.find(c => c.id === id).total} usando ${metodo.toUpperCase()}?`)) {
      await fetch(`https://fiestas-backend.onrender.com/api/comandas/${id}/pago`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metodo_pago: metodo })
      });
      cargarMisComandas();
    }
  };

  const cerrarSesion = () => { localStorage.removeItem('usuarioFiestas'); navigate('/login'); };

  // Filtrado de la carta
  const cartaFiltrada = filtroTipo === 'todos'
    ? cartaAgrupada
    : cartaAgrupada.filter(plato => plato.variaciones[0].tipo === filtroTipo);

  // Colores de estado
  const getColorEstado = (estado) => {
    if (estado === 'pendiente') return '#ffb703'; // Amarillo
    if (estado === 'preparando') return '#f77f00'; // Naranja
    if (estado === 'completada') return '#0077b6'; // Azul
    return 'gray';
  };

  if (!mozo) return <div>Cargando...</div>;
  const totalCarrito = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'var(--playa-mar)' }}>👨‍🍳 Hola, {mozo.nombre_usuario}</h1>
        <button onClick={cerrarSesion} className="btn-primary" style={{ width: 'auto', backgroundColor: '#e63946' }}>Cerrar Sesión</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className="btn-primary" style={{ backgroundColor: tabActivo === 'nueva' ? 'var(--playa-mar)' : '#ccc' }} onClick={() => setTabActivo('nueva')}>
          {comandaTarget ? 'Agregando Platos...' : 'Tomar Pedido'}
        </button>
        <button className="btn-primary" style={{ backgroundColor: tabActivo === 'mis_comandas' ? 'var(--playa-mar)' : '#ccc' }} onClick={() => setTabActivo('mis_comandas')}>Mis Comandas de Hoy</button>
      </div>

      {/* ==================== PESTAÑA: TOMAR PEDIDO ==================== */}
      {tabActivo === 'nueva' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          <div className="card" style={{ flex: '2', minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Carta</h2>
              <select className="input-field" style={{ width: 'auto', margin: 0 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos los productos</option>
                <option value="plato">🥘 Platos</option>
                <option value="cerveza">🍺 Cervezas</option>
                <option value="gaseosa">🥤 Gaseosas</option>
              </select>
            </div>
              {cartaFiltrada.map(plato => <PlatoCard key={plato.nombre} plato={plato} onAgregar={agregarAlCarrito} />)}       
            </div>

          <div className="card" style={{ flex: '1', minWidth: '250px', backgroundColor: comandaTarget ? '#fff3cd' : 'var(--playa-celeste)', border: comandaTarget ? '2px solid #ffb703' : 'none' }}>
            <h2>{comandaTarget ? `Agregando a Orden #${comandaTarget}` : 'Orden Actual'}</h2>

            {!comandaTarget && (
              <input type="text" className="input-field" placeholder="Mesa, Nombre o Nota (Opcional)" value={notaComanda} onChange={e => setNotaComanda(e.target.value)} style={{ backgroundColor: 'white' }} />
            )}

            {carrito.length === 0 ? <p>No hay platos seleccionados.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {carrito.map((item, idx) => (
                  <li key={idx} style={{ background: 'white', padding: '10px', marginBottom: '5px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{item.cantidad}x {item.nombre}</strong> <br /><small>({item.presentacion})</small></div>
                    <div style={{ textAlign: 'right' }}>
                      <span>S/ {(item.cantidad * item.precio_unitario).toFixed(2)}</span><br />
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => disminuirDelCarrito(idx)} style={{ background: '#fff3cd', border: '1px solid orange', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>-1</button>
                        <button onClick={() => quitarDelCarrito(idx)} style={{ background: '#ffcccc', border: '1px solid red', color: 'red', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>X Todo</button>
                      </div>
                    </div>                  </li>
                ))}
              </ul>
            )}
            <h3 style={{ borderTop: '2px solid white', paddingTop: '10px' }}>Total a agregar: S/ {totalCarrito.toFixed(2)}</h3>

            <button className="btn-primary" style={{ backgroundColor: 'var(--playa-sol)', color: 'var(--texto-oscuro)' }} onClick={procesarComanda}>
              {comandaTarget ? 'Guardar en Comanda Existente' : 'Enviar a Cocina'}
            </button>

            {comandaTarget && (
              <button onClick={cancelarEdicion} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: 'red', textDecoration: 'underline', cursor: 'pointer' }}>
                Cancelar edición
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== PESTAÑA: MIS COMANDAS DE HOY ==================== */}
      {tabActivo === 'mis_comandas' && (
        <div className="card">
          <h2>Órdenes de Hoy</h2>
          {misComandas.length === 0 ? <p>Aún no has creado comandas hoy.</p> : (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {misComandas.map(comanda => {
                const esPagado = comanda.estado_pago === 'pagado';
                return (
                  <div key={comanda.id} style={{ border: `2px solid ${esPagado ? '#ccc' : 'var(--playa-mar)'}`, borderRadius: '8px', padding: '15px', width: '320px', backgroundColor: esPagado ? '#f9f9f9' : 'white', opacity: esPagado ? 0.8 : 1 }}>

                    {/* Cabecera Tarjeta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Comanda #{comanda.id}</h3>
                      {!esPagado && (
                        <span style={{ color: 'white', background: getColorEstado(comanda.estado), padding: '4px 10px', borderRadius: '15px', fontSize: '0.8em', fontWeight: 'bold' }}>
                          {comanda.estado.toUpperCase()}
                        </span>
                      )}
                      {esPagado && <span style={{ color: '#2a9d8f', fontWeight: 'bold' }}>✓ PAGADO</span>}
                    </div>

                    {/* Nota / Identificador */}
                    {comanda.nota && (
                      <p style={{ margin: '5px 0', color: '#666', fontStyle: 'italic' }}>📌 {comanda.nota}</p>
                    )}

                    {/* Lista de Platos */}
                    <ul style={{ paddingLeft: '0', marginTop: '15px', listStyle: 'none' }}>
                      {comanda.items.map(det => (
                        <li key={det.detalle_id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                          <div>
                            <strong>{det.cantidad}x</strong> {det.nombre} <small>({det.presentacion})</small> <br />
                            {!esPagado && (
                              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                <button onClick={() => disminuirUnPlato(det.detalle_id)} style={{ fontSize: '0.8em', background: '#fff3cd', border: '1px solid orange', borderRadius: '4px', cursor: 'pointer' }}>-1 (Restar)</button>
                                <button onClick={() => eliminarPlatoDeComanda(det.detalle_id)} style={{ fontSize: '0.8em', background: '#ffcccc', border: '1px solid red', borderRadius: '4px', cursor: 'pointer' }}>Borrar todos</button>
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 'bold', color: 'var(--playa-mar)' }}>
                            S/ {(det.cantidad * det.precio_unitario).toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {!esPagado && (
                      <button onClick={() => iniciarEdicionComanda(comanda.id)} style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: '#e9ecef', border: '1px dashed #ccc', borderRadius: '5px', cursor: 'pointer' }}>
                        + Agregar más productos a esta orden
                      </button>
                    )}

                    <h3 style={{ textAlign: 'right', color: esPagado ? '#666' : 'black' }}>Total: S/ {parseFloat(comanda.total).toFixed(2)}</h3>

                    {/* ZONA DE COBRO (Solo si no está pagado) */}
                    {!esPagado && (
                      <div style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                        <label style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px', display: 'block' }}>Método de Pago:</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select id={`pago-${comanda.id}`} className="input-field" style={{ margin: 0, flex: 1, padding: '8px' }}>
                            <option value="efectivo">Efectivo 💵</option>
                            <option value="yape">Yape / Plin 📱</option>
                            <option value="tarjeta">Tarjeta 💳</option>
                          </select>
                          <button onClick={() => registrarPago(comanda.id)} className="btn-primary" style={{ backgroundColor: '#2a9d8f', flex: 1, padding: '8px' }}>Cobrar</button>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                          <button onClick={() => eliminarComandaEntera(comanda.id)} style={{ background: 'none', border: 'none', color: 'red', textDecoration: 'underline', cursor: 'pointer' }}>Anular toda la comanda</button>
                        </div>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}