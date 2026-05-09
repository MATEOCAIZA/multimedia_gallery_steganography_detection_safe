import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notifySuccess, notifyError, notifyInfo } from '../lib/notifications';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FormCard, StatsSection } from '../components/UserPanelComponents';

export default function UserPanel() {
  // --- Estados para Formulario 1: Crear Álbum en Lote ---
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivosLote, setArchivosLote] = useState([]);
  const [isSubmittingLote, setIsSubmittingLote] = useState(false);

  const [albumId, setAlbumId] = useState('');
  const [archivosExtra, setArchivosExtra] = useState([]); // AHORA ES UN ARREGLO
  const [misAlbums, setMisAlbums] = useState([]);
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);

  const cargarAlbums = () => {
    api.get('/api/albums/todos')
      .then(res => setMisAlbums(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error('Error cargando albumes:', err);
        notifyError('Error al cargar álbumes');
        setMisAlbums([]);
      });
  };

  // Cargar álbumes al iniciar para llenar el selector del Formulario 2
  useEffect(() => {
    cargarAlbums();
  }, []);

  // --- Función 1: Crear Álbum (con o sin archivos) ---
  const crearAlbumEnLote = async (e) => {
    e.preventDefault();
    setIsSubmittingLote(true);
    
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    
    if (archivosLote.length > 0) {
      for (let i = 0; i < archivosLote.length; i++) {
        formData.append('archivos', archivosLote[i]);
      }
    }

    try {
      // 1. Obtenemos el token
      const csrfResponse = await api.get('/api/auth/csrf');
      const csrfToken = csrfResponse.headers['x-xsrf-token'];

      // 2. Enviamos el POST inyectando la cabecera
      const res = await api.post('/api/albums/solicitar-lote', formData, {
        headers: {
          'X-XSRF-TOKEN': csrfToken
        }
      });
      
      notifySuccess('✅ Álbum creado. En revisión si incluye archivos.');
      
      // Limpiar formulario 1
      setTitulo(''); setDescripcion(''); setArchivosLote([]);
      document.getElementById('input-lote').value = null;
      cargarAlbums();
    } catch (err) {
      notifyError(err.response?.data || "Error al crear álbum");
    } finally {
      setIsSubmittingLote(false);
    }
  };

  // --- Función 2: Subir archivos a álbum existente ---
  const subirArchivoExtra = async (e) => {
    e.preventDefault();
    if (archivosExtra.length === 0 || !albumId) {
      notifyError('Selecciona un álbum y al menos un archivo');
      return;
    }

    setIsSubmittingExtra(true);

    const formData = new FormData();
    // Iteramos para agregar todos los archivos seleccionados
    for (let i = 0; i < archivosExtra.length; i++) {
      formData.append("archivos", archivosExtra[i]); // La llave ahora es "archivos"
    }

    try {
      // 1. Obtenemos el token
      const csrfResponse = await api.get('/api/auth/csrf');
      const csrfToken = csrfResponse.headers['x-xsrf-token'];

      // 2. Enviamos el POST inyectando la cabecera
      const res = await api.post(`/api/images/upload/${albumId}`, formData, {
        headers: {
          'X-XSRF-TOKEN': csrfToken
        }
      });
      
      notifySuccess('✅ Archivos subidos correctamente');
      
      // Limpiar formulario 2
      setArchivosExtra([]);
      document.getElementById('input-extra').value = null;
    } catch (err) {
      const errorMsg = err.response?.data || "Error al subir los archivos";
      notifyError(errorMsg);
    } finally {
      setIsSubmittingExtra(false);
    }
  };

  return (
    <div className="user-panel" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <section style={{ marginBottom: '40px' }}>
        <span style={{
          display: 'inline-block',
          backgroundColor: 'rgba(20, 184, 166, 0.12)',
          color: '#0f766e',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.8em',
          fontWeight: 'bold',
          marginBottom: '16px',
          textTransform: 'uppercase'
        }}>
          Área Privada
        </span>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '2.5em',
          fontWeight: 'bold',
          color: 'var(--text)'
        }}>
          Panel de Usuario
        </h1>
        <p style={{
          margin: 0,
          fontSize: '1.1em',
          color: 'var(--muted)',
          maxWidth: '600px'
        }}>
          Administra tus álbumes, sube imágenes y organiza tu contenido en un espacio seguro.
        </p>
      </section>

      <StatsSection />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        
        {/* FORMULARIO 1: Lote */}
        <FormCard stepNumber={1} title="Crear nuevo álbum" description="Crea un álbum y opcionalmente adjunta múltiples imágenes.">
          <form className="user-panel__form" onSubmit={crearAlbumEnLote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="field" style={{ margin: 0 }}>
              <span style={{ color: 'var(--muted-strong)', fontSize: '0.9em', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Título del álbum</span>
              <div className="field__control">
                <input 
                  type="text" 
                  placeholder="Ej: Viaje a la costa" 
                  required
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid rgba(20, 184, 166, 0.18)',
                    color: 'var(--text)',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    width: '100%',
                    fontSize: '0.95em'
                  }}
                />
              </div>
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span style={{ color: 'var(--muted-strong)', fontSize: '0.9em', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Descripción</span>
              <div className="field__control field__control--textarea">
                <textarea 
                  placeholder="Describe el contenido del álbum" 
                  required 
                  rows="3"
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid rgba(20, 184, 166, 0.18)',
                    color: 'var(--text)',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    width: '100%',
                    fontSize: '0.95em',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </label>

            <div>
              <label style={{ color: 'var(--muted-strong)', fontSize: '0.9em', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Archivos (Imágenes)</label>
              <div style={{
                border: '2px dashed rgba(20, 184, 166, 0.24)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(20, 184, 166, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#14b8a6';
                e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.08)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.24)';
                e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.04)';
              }}>
                <input 
                  id="input-lote" 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => setArchivosLote(e.target.files)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="input-lote" style={{ cursor: 'pointer' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
                    {archivosLote.length > 0 ? (
                      <>
                        <strong style={{ color: '#0f766e' }}>✓ {archivosLote.length} archivo(s) seleccionado(s)</strong>
                        <div style={{ fontSize: '0.8em', marginTop: '4px' }}>Haz clic para cambiar</div>
                      </>
                    ) : (
                      <>
                        <div>Haz clic o arrastra archivos aquí</div>
                        <div style={{ fontSize: '0.8em', marginTop: '4px' }}>PNG, JPG (opcional)</div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmittingLote}
              style={{
                background: isSubmittingLote ? '#94a3b8' : 'linear-gradient(135deg, #14b8a6 0%, #0f9b8f 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: isSubmittingLote ? 'not-allowed' : 'pointer',
                fontSize: '0.95em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmittingLote) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmittingLote) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isSubmittingLote ? (
                <>
                  <LoadingSpinner /> Procesando...
                </>
              ) : (
                '✓ Crear y Enviar a Revisión'
              )}
            </button>
          </form>
        </FormCard>

        <FormCard stepNumber={2} title="Agregar a álbum existente" description="Sube múltiples imágenes a un álbum ya creado y aprobado.">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={subirArchivoExtra}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: 'var(--muted-strong)', fontSize: '0.9em', fontWeight: '600' }}>Álbum destino</label>
                <button
                  type="button"
                  onClick={cargarAlbums}
                  title="Recargar lista de álbumes aprobados"
                  style={{
                    background: 'rgba(20, 184, 166, 0.08)',
                    color: '#0f766e',
                    border: '1px solid rgba(20, 184, 166, 0.18)',
                    padding: '4px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75em',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Recargar
                </button>
              </div>
              <select
                value={albumId}
                onChange={e => setAlbumId(e.target.value)}
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.96)',
                  border: '1px solid rgba(20, 184, 166, 0.18)',
                  color: 'var(--text)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  width: '100%',
                  fontSize: '0.95em',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Selecciona un álbum --</option>
                {misAlbums.map(a => (
                  <option key={a.id} value={a.id}>{a.titulo || a.nombre || `Álbum ${a.id}`}</option>
                ))}
              </select>
              {misAlbums.length === 0 && (
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '8px' }}>
                  ℹ No hay álbumes aprobados. Crea uno en el Paso 1 y espera aprobación.
                </small>
              )}
            </div>

            <div>
              <label style={{ color: 'var(--muted-strong)', fontSize: '0.9em', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Archivos (Imágenes)</label>
              <div style={{
                border: '2px dashed rgba(20, 184, 166, 0.24)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(20, 184, 166, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#14b8a6';
                e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.08)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.24)';
                e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.04)';
              }}>
                <input
                  id="input-extra"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setArchivosExtra(e.target.files)}
                  style={{ display: 'none' }}
                />
                <label htmlFor="input-extra" style={{ cursor: 'pointer' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
                    {archivosExtra.length > 0 ? (
                      <>
                        <strong style={{ color: '#0f766e' }}>✓ {archivosExtra.length} archivo(s) seleccionado(s)</strong>
                        <div style={{ fontSize: '0.8em', marginTop: '4px' }}>Haz clic para cambiar</div>
                      </>
                    ) : (
                      <>
                        <div>Haz clic o arrastra archivos aquí</div>
                        <div style={{ fontSize: '0.8em', marginTop: '4px' }}>PNG, JPG (múltiples)</div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmittingExtra}
              style={{
                background: isSubmittingExtra ? '#94a3b8' : 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: isSubmittingExtra ? 'not-allowed' : 'pointer',
                fontSize: '0.95em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmittingExtra) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 12px rgba(2, 132, 199, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmittingExtra) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {isSubmittingExtra ? (
                <>
                  <LoadingSpinner /> Subiendo...
                </>
              ) : (
                '⬆ Subir Archivos'
              )}
            </button>
          </form>
        </FormCard>

      </div>
    </div>
  );
}