import React, { useState, useEffect } from 'react';
import { api, apiUrl } from '../lib/api';
import { notifySuccess, notifyError } from '../lib/notifications';
import ConfirmModal from '../components/ConfirmModal';

export default function SupervisorPanel() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const res = await api.get('/api/admin/pendientes');
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    }
  };

  const manejarAccionAlbum = async (id, accion) => {
    setConfirmData({ id, accion });
    setConfirmOpen(true);
  };

  const ejecutarAccionAlbum = async () => {
    const { id, accion } = confirmData || {};
    setConfirmOpen(false);
    if (!id || !accion) return;

    try {
      // 1. Obtenemos el token CSRF
      const csrfResponse = await api.get('/api/auth/csrf');
      const csrfToken = csrfResponse.headers['x-xsrf-token'];
      
      // 2. Configuramos la cabecera
      const config = {
        headers: { 'X-XSRF-TOKEN': csrfToken }
      };

      // 3. Ejecutamos la petición asegurando la sintaxis correcta de Axios
      // POST: (url, body, config) | DELETE: (url, config)
      const res = accion === 'aprobar'
        ? await api.post(`/api/admin/albums/${id}/aprobar`, {}, config)
        : await api.delete(`/api/admin/albums/${id}/rechazar`, config);

      notifySuccess(`✅ ${res.data}`);
      cargarSolicitudes();
    } catch (err) {
      notifyError(err.response?.data || 'No se pudo completar la acción');
    }
  };

  const manejarAccionImagen = async (id, accion) => {
    try {
      // 1. Obtenemos el token CSRF
      const csrfResponse = await api.get('/api/auth/csrf');
      const csrfToken = csrfResponse.headers['x-xsrf-token'];
      
      // 2. Configuramos la cabecera
      const config = {
        headers: { 'X-XSRF-TOKEN': csrfToken }
      };

      // 3. Ejecutamos PUT (url, body, config)
      const res = accion === 'aprobar'
        ? await api.put(`/api/admin/image/${id}/approve`, {}, config)
        : await api.put(`/api/admin/image/${id}/reject`, {}, config);
        
      notifySuccess(`✅ ${res.data}`);
      cargarSolicitudes();
    } catch (err) {
      notifyError(err.response?.data || 'Error interno');
    }
  };

  return (
    <div className="supervisor-panel" style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.1)', paddingBottom: '10px', color: 'var(--text)' }}>
        Centro de Control y Auditoría Perimetral
      </h2>
      
      <ConfirmModal
        open={confirmOpen}
        title="Confirmar acción"
        message={`¿Estás seguro de que deseas ${confirmData?.accion || ''} este álbum completo?`}
        onConfirm={ejecutarAccionAlbum}
        onCancel={() => setConfirmOpen(false)}
        confirmText="Aceptar"
        cancelText="Cancelar"
      />

      {solicitudes.length === 0 ? (
        <p style={{ fontSize: '1.1em', color: 'var(--muted)' }}> No hay solicitudes de álbumes pendientes de revisión.</p>
      ) : (
        solicitudes.map(album => {
          const tieneInfecciones = album.imagenes.some(img => img.estado === 'QUARANTINE');

          return (
            <div key={album.id} style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '18px', marginBottom: '30px', boxShadow: '0 14px 28px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
              
              {/* Cabecera del Álbum */}
              <div style={{ background: tieneInfecciones ? 'rgba(254, 243, 199, 0.8)' : 'rgba(20, 184, 166, 0.05)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}> {album.titulo}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>{album.descripcion}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => manejarAccionAlbum(album.id, 'aprobar')} style={{ background: '#2ec27e', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Aprobar Álbum Completo
                  </button>
                  <button onClick={() => manejarAccionAlbum(album.id, 'rechazar')} style={{ background: '#e01b24', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Rechazar y Destruir
                  </button>
                </div>
              </div>

              {tieneInfecciones && (
                <div style={{ background: 'rgba(254, 226, 226, 0.92)', color: '#7f1d1d', padding: '12px 20px', fontWeight: 'bold', borderBottom: '1px solid rgba(239, 68, 68, 0.14)' }}>
                    ATENCIÓN: Se detectó archivos anómalos en este lote.
                </div>
              )}

              {/* Cuadrícula de Archivos */}
              <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', background: 'rgba(248, 251, 252, 0.92)' }}>
                {album.imagenes.map(img => (
                  <div key={img.id} style={{ width: '200px', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.96)', display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ height: '140px', background: 'rgba(20, 184, 166, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {/* LÓGICA CORREGIDA: Si está en cuarentena, muestra reporte técnico */}
                      {img.estado === 'QUARANTINE' ? (
                        <div style={{ 
                          padding: '10px', 
                          background: '#0f172a', 
                          fontSize: '0.7em',
                          color: '#8ef1c4', 
                          fontFamily: 'monospace',
                          width: '100%',
                          height: '100%'
                        }}>
                          <strong style={{ color: '#f87171' }}>[DETECCION_ANOMALIA]</strong>
                          <div style={{ marginTop: '5px', color: '#fbbf24' }}>{img.motivoAlerta || "Inconsistencia estructural"}</div>
                          <ul style={{ padding: 0, margin: '5px 0', listStyle: 'none' }}>
                            <li> ESTEGANOGRAFIA_LSB: <span style={{color: '#f87171'}}>DETECTADA</span></li>
                            <li> DATA_POST_EOF: <span style={{color: '#f87171'}}>TRUE</span></li>
                            <li> Name of the file: <span style={{color: '#f87171'}}>{img.nombreArchivo}</span></li>
                          </ul>
                        </div>
                      ) : (
                        /* Si está limpia, muestra la imagen real */
                        <img 
                          src={apiUrl(`/api/public/view/${img.nombreArchivo}`)} 
                          alt="Segura" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      )}
                    </div>
                    
                    {/* Badge de Estado */}
                    <div style={{ padding: '8px', textAlign: 'center', fontSize: '0.85em', fontWeight: 'bold', background: img.estado === 'QUARANTINE' ? '#ef4444' : '#14b8a6', color: 'white' }}>
                      {img.estado === 'QUARANTINE' ? '⚠ CUARENTENA' : '🛡 SEGURO'}
                    </div>

                    {/* Acciones Individuales para archivos en cuarentena */}
                    {img.estado === 'QUARANTINE' && (
                      <div style={{ display: 'flex', padding: '10px', gap: '5px', background: 'rgba(248, 251, 252, 0.92)' }}>
                         <button onClick={() => manejarAccionImagen(img.id, 'aprobar')} style={{ flex: 1, background: '#7dd3fc', color: '#0f172a', border: 'none', padding: '5px', borderRadius: '999px', fontSize: '0.8em', cursor: 'pointer' }}>
                           Forzar
                         </button>
                         <button onClick={() => manejarAccionImagen(img.id, 'rechazar')} style={{ flex: 1, background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '5px', borderRadius: '999px', fontSize: '0.8em', cursor: 'pointer' }}>
                           Borrar
                         </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}