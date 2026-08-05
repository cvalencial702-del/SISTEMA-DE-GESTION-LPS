// ============================================
// ADJUNTOS — carga de archivos en base64
// SIG HSEQ Colombia · LPS Grupo
//
// Componente compartido por index.html, procesos-gestion.html y
// talento-humano.html. Depende únicamente de getSupabase(), que cada
// página define en línea. No declara variables globales adicionales
// para evitar colisiones con los scripts de cada página.
// ============================================
const adjuntos = {
  MAX_BYTES: 3 * 1024 * 1024, // 3 MB por archivo

  formatSize(b) {
    if (!b) return '';
    return b < 1024 ? b + ' B'
         : b < 1048576 ? (b / 1024).toFixed(0) + ' KB'
         : (b / 1048576).toFixed(1) + ' MB';
  },

  // Abre el selector de archivos del sistema
  seleccionar(accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg') {
    return new Promise(resolve => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = accept;
      inp.onchange = () => resolve(inp.files[0] || null);
      inp.click();
    });
  },

  // Lee un File y lo convierte a base64 (sin el prefijo data:)
  leerArchivo(file) {
    return new Promise((resolve, reject) => {
      if (file.size > adjuntos.MAX_BYTES) {
        reject(new Error('El archivo pesa ' + adjuntos.formatSize(file.size) +
          '. El máximo permitido es ' + adjuntos.formatSize(adjuntos.MAX_BYTES) + '.'));
        return;
      }
      const r = new FileReader();
      r.onload = () => resolve({
        nombre_archivo: file.name,
        mime_type: file.type || 'application/octet-stream',
        contenido_base64: String(r.result).split(',')[1],
        tamano_bytes: file.size
      });
      r.onerror = () => reject(new Error('No se pudo leer el archivo'));
      r.readAsDataURL(file);
    });
  },

  async listar(tabla, filtro) {
    const sb = getSupabase(); if (!sb) return [];
    let q = sb.from(tabla).select('id,nombre_archivo,mime_type,created_at' +
      (tabla === 'empleado_archivos' ? ',tipo_archivo,tamano_bytes' : ''));
    Object.entries(filtro).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) { console.error('adjuntos.listar', tabla, error); return []; }
    return data || [];
  },

  async subir(tabla, fila) {
    const sb = getSupabase(); if (!sb) throw new Error('Sin conexión a la base de datos');
    const { data, error } = await sb.from(tabla).insert(fila).select('id');
    if (error) throw error;
    return data[0];
  },

  async eliminar(tabla, id) {
    const sb = getSupabase(); if (!sb) throw new Error('Sin conexión a la base de datos');
    const { error } = await sb.from(tabla).delete().eq('id', id);
    if (error) throw error;
  },

  // Recupera el contenido y lo abre (PDF/imagen) o lo descarga (Office)
  async abrir(tabla, id) {
    const sb = getSupabase(); if (!sb) return;
    const { data, error } = await sb.from(tabla)
      .select('nombre_archivo,mime_type,contenido_base64').eq('id', id).single();
    if (error || !data || !data.contenido_base64) {
      alert('No se pudo recuperar el archivo'); return;
    }
    const bin = atob(data.contenido_base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: data.mime_type });
    const url = URL.createObjectURL(blob);
    if (/^(application\/pdf|image\/|text\/)/.test(data.mime_type)) {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url; a.download = data.nombre_archivo; a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },

  // Gestor visual: se inyecta en cualquier página sin necesitar HTML previo
  // opts = {tabla, filtro:{campo:valor}, titulo, subtitulo, tipos?:[], onCambio?}
  async gestor(opts) {
    const { tabla, filtro, titulo, subtitulo, tipos, onClose } = opts;
    const previo = document.getElementById('adjOverlay');
    if (previo) previo.remove();

    const ov = document.createElement('div');
    ov.id = 'adjOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,37,64,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:640px;width:100%;max-height:86vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">' +
        '<div style="background:linear-gradient(135deg,#0A2540,#123A5E);color:#fff;padding:16px 22px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">' +
          '<div><h3 style="margin:0;font-size:15px;color:#fff;">📎 ' + titulo + '</h3>' +
          '<div style="font-size:11px;color:#B0C9E4;margin-top:3px;">' + (subtitulo || '') + '</div></div>' +
          '<button id="adjCerrar" style="background:rgba(255,255,255,.15);border:0;color:#fff;width:28px;height:28px;border-radius:7px;cursor:pointer;font-size:15px;flex-shrink:0;">✕</button>' +
        '</div>' +
        '<div style="padding:18px 22px;">' +
          (tipos ? '<label style="font-size:10.5px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:5px;">Tipo de documento</label>' +
            '<select id="adjTipo" style="width:100%;padding:9px 11px;border:1px solid #D0DFF0;border-radius:8px;font-size:13px;margin-bottom:14px;">' +
            tipos.map(t => '<option>' + t + '</option>').join('') + '</select>' : '') +
          '<button id="adjBtnSubir" style="width:100%;padding:13px;border:2px dashed #1598FF;background:#F2F9FF;color:#0A6BC4;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;">⬆️ Seleccionar archivo (máx. 3 MB)</button>' +
          '<div id="adjLista" style="margin-top:16px;"><p style="font-size:12px;color:#5B6B7C;">Cargando...</p></div>' +
        '</div>' +
      '</div>';
    ov.onclick = e => { if (e.target === ov) { ov.remove(); if(typeof onClose==='function') onClose(); } };
    document.body.appendChild(ov);
    document.getElementById('adjCerrar').onclick = () => { ov.remove(); if(typeof onClose==='function') onClose(); };

    const pintar = async () => {
      const rows = await adjuntos.listar(tabla, filtro);
      const cont = document.getElementById('adjLista');
      if (!cont) return;
      if (!rows.length) {
        cont.innerHTML = '<p style="font-size:12px;color:#5B6B7C;text-align:center;padding:18px;">Todavía no hay archivos adjuntos.</p>';
        return;
      }
      cont.innerHTML =
        '<div style="font-size:10.5px;font-weight:700;color:#0A2540;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">' +
        rows.length + ' archivo' + (rows.length > 1 ? 's' : '') + '</div>' +
        rows.map(r => {
          const ico = /pdf/.test(r.mime_type) ? '📕'
                    : /image/.test(r.mime_type) ? '🖼️'
                    : /sheet|excel/.test(r.mime_type) ? '📊'
                    : /word|document/.test(r.mime_type) ? '📘' : '📄';
          const meta = [r.tipo_archivo, adjuntos.formatSize(r.tamano_bytes),
            r.created_at ? new Date(r.created_at).toLocaleDateString('es-CO') : null]
            .filter(Boolean).join(' · ');
          return '<div style="display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid #E2EBF3;border-radius:9px;margin-bottom:7px;">' +
            '<span style="font-size:18px;">' + ico + '</span>' +
            '<div style="flex:1;min-width:0;"><div style="font-size:12.5px;font-weight:600;color:#0F1B2A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + r.nombre_archivo + '</div>' +
            (meta ? '<div style="font-size:10px;color:#5B6B7C;">' + meta + '</div>' : '') + '</div>' +
            '<button data-ver="' + r.id + '" style="background:#EAF5FF;border:0;color:#0A6BC4;padding:6px 11px;border-radius:7px;cursor:pointer;font-size:11px;font-weight:600;">👁 Abrir</button>' +
            '<button data-del="' + r.id + '" style="background:#FEE2E2;border:0;color:#DC2626;padding:6px 9px;border-radius:7px;cursor:pointer;font-size:11px;">🗑</button>' +
          '</div>';
        }).join('');

      cont.querySelectorAll('[data-ver]').forEach(b =>
        b.onclick = () => adjuntos.abrir(tabla, b.dataset.ver));
      cont.querySelectorAll('[data-del]').forEach(b =>
        b.onclick = async () => {
          if (!confirm('¿Eliminar este archivo?')) return;
          try {
            await adjuntos.eliminar(tabla, b.dataset.del);
            await pintar();
            if (typeof opts.onCambio === 'function') opts.onCambio();
          } catch (e) { alert('No se pudo eliminar: ' + e.message); }
        });
    };

    document.getElementById('adjBtnSubir').onclick = async () => {
      const btn = document.getElementById('adjBtnSubir');
      try {
        const file = await adjuntos.seleccionar();
        if (!file) return;
        btn.disabled = true;
        btn.textContent = '⏳ Subiendo ' + file.name + '...';
        const datos = await adjuntos.leerArchivo(file);
        const fila = Object.assign({}, filtro, datos);
        if (tipos) fila.tipo_archivo = document.getElementById('adjTipo').value;
        // tamano_bytes solo existe en empleado_archivos
        if (tabla !== 'empleado_archivos') delete fila.tamano_bytes;
        await adjuntos.subir(tabla, fila);
        await pintar();
        if (typeof opts.onCambio === 'function') opts.onCambio();
      } catch (e) {
        alert('❌ ' + (e.message || e));
      } finally {
        btn.disabled = false;
        btn.textContent = '⬆️ Seleccionar archivo (máx. 3 MB)';
      }
    };

    pintar();
  }
};
