import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, apiUrl } from '../lib/api'; 

export default function Album() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem('user')); // Leemos el usuario para el render condicional
  
  const [albumInfo, setAlbumInfo] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [archivosExtra, setArchivosExtra] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // 1. Centralizamos la carga en una sola función que use la ruta PÚBLICA
  const cargarAlbum = () => {
    setLoading(true);
    // Llamada correcta al nuevo endpoint de detalle
    api.get(`/api/albums/publico/${id}`) 
      .then(res => {
        setAlbumInfo(res.data.album);
        setImages(res.data.imagenes);
      })
      .catch(err => {
        console.error("Error al cargar detalle:", err);
        setError("Álbum no encontrado o no aprobado.");
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    cargarAlbum();
  }, [id]);

  const subirArchivosAlAlbum = async (e) => {
    e.preventDefault();
    if (archivosExtra.length === 0) return;

    setIsUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    for (let i = 0; i < archivosExtra.length; i++) {
      formData.append('archivos', archivosExtra[i]);
    }

    try {
      // 1. Guardamos la respuesta del GET para atrapar el token
      const csrfResponse = await api.get('/api/auth/csrf');
      
      // 2. Extraemos el token de la cabecera expuesta
      const csrfToken = csrfResponse.headers['x-xsrf-token'];

      // 3. Enviamos el POST (FormData) inyectando la cabecera explícitamente
      const res = await api.post(`/api/images/upload/${id}`, formData, {
        headers: {
          'X-XSRF-TOKEN': csrfToken
        }
      });
      
      setUploadMessage(`✅ ${res.data}`);
      setArchivosExtra([]);
      if(document.getElementById('file-upload-album')) {
          document.getElementById('file-upload-album').value = null;
      }

      cargarAlbum(); // Recarga usando la ruta pública
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (err) {
      setUploadMessage(`❌ Error: ${err.response?.data || 'No se pudieron subir los archivos.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && !albumInfo) return <div style={{ padding: '20px', color: 'var(--muted)' }}>⏳ Cargando evidencias...</div>;
  if (error) return <div style={{ padding: '20px', color: '#7f1d1d', background: 'rgba(254, 226, 226, 0.92)', border: '1px solid rgba(239, 68, 68, 0.14)', borderRadius: '16px' }}>❌ {error}</div>;

  return (
    <div className="album-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      
      {albumInfo && (
        <div className="album-page__top" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ margin: '0 0 10px 0', color: 'var(--text)' }}>📂 {albumInfo.titulo}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.1em' }}>{albumInfo.descripcion}</p>
        </div>
      )}

      <h3 style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.08)', paddingBottom: '10px' }}>Galería</h3>
      
      <div className="album-gallery" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {images.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Este álbum aún no tiene imágenes aprobadas.</p>
        ) : (
          images.map(img => (
            <div className="image-card" key={img.id} style={{ width: '220px', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '18px', overflow: 'hidden' }}>
              <div style={{ height: '160px', background: 'rgba(20, 184, 166, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                  src={apiUrl(`/api/public/view/${img.nombreArchivo}`)} 
                  alt={img.nombreArchivo} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="meta" style={{ padding: '12px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', wordBreak: 'break-all', color: 'var(--text)' }}>📄 {img.nombreArchivo}</p>
                <span style={{ color: '#0f766e', fontSize: '0.75em', fontWeight: 'bold' }}>✅ Inspección aprobada</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}