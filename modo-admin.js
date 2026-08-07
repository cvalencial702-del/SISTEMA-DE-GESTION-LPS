/* ============================================================
   MODO LECTOR / ADMINISTRADOR — Sistema de Gestión LPS
   Por defecto el sistema arranca en modo LECTOR: se ocultan los
   controles de edición (Editar, Eliminar, Nueva/o, Agregar, Guardar).
   Con la clave LPS-SIG se activa el modo ADMINISTRADOR y aparecen.
   Se incluye con <script src="modo-admin.js"></script> en cada página.
   ============================================================ */
(function(){
  let adminMode = false;
  const ADMIN_KEY = 'LPS-SIG';

  function esControlEdicion(el){
    const txt = (el.textContent || '').toLowerCase().trim();
    const oc = (el.getAttribute && el.getAttribute('onclick')) || '';
    // Se ocultan ÚNICAMENTE los controles de MODIFICAR y ELIMINAR.
    // (Crear, guardar, buscar, generar PDF y links siguen visibles para la operación.)
    const esEditar = txt.includes('editar') || txt.includes('modificar') || /(^|[^a-z])(edit|modificar)[A-Z(]/.test(oc) || txt==='✏️' || txt.startsWith('✏️');
    const esEliminar = txt.includes('eliminar') || txt.includes('borrar') || txt.includes('🗑') || txt==='✕' && /(^|[^a-z])(del|delete|eliminar|borrar)/i.test(oc) || /(^|[^a-z])(del|delete|eliminarreq|delreq)/i.test(oc);
    return esEditar || esEliminar;
  }

  function aplicar(){
    document.querySelectorAll('button, a').forEach(el=>{
      if(el.id==='btnAdminMode') return;
      if(el.classList && (el.classList.contains('tab') || el.classList.contains('sb-btn') || el.classList.contains('topnav') || el.classList.contains('sb-back'))) return;
      if(esControlEdicion(el)){
        // Guardar el display original la primera vez
        if(el.dataset.origDisplay===undefined){ el.dataset.origDisplay = el.style.display || ''; }
        el.style.display = adminMode ? (el.dataset.origDisplay||'') : 'none';
      }
    });
    const b=document.getElementById('btnAdminMode');
    if(b){
      if(adminMode){ b.textContent='🔓 Administrador'; b.style.background='#DCFCE7'; b.style.color='#166534'; b.style.borderColor='#86EFAC'; }
      else { b.textContent='🔒 Modo lectura'; b.style.background='#EAF5FF'; b.style.color='#0A6BC4'; b.style.borderColor='#C4D8F0'; }
    }
  }

  window.toggleAdminMode = function(){
    if(adminMode){ adminMode=false; aplicar(); return; }
    const k=prompt('🔐 Ingrese la clave de administrador para habilitar edición:');
    if(k===null) return;
    if(k!==ADMIN_KEY){ alert('⚠️ Clave incorrecta.'); return; }
    adminMode=true; aplicar();
  };

  // Insertar el botón flotante si la página no lo tiene
  function insertarBoton(){
    if(document.getElementById('btnAdminMode')) return;
    const b=document.createElement('button');
    b.id='btnAdminMode';
    b.onclick=window.toggleAdminMode;
    b.textContent='🔒 Modo lectura';
    b.style.cssText='position:fixed;top:12px;right:12px;z-index:10000;background:#EAF5FF;color:#0A6BC4;border:1px solid #C4D8F0;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(10,37,64,.15);';
    document.body.appendChild(b);
  }

  // Re-aplicar cuando cambia el DOM (contenido dinámico)
  let obs=null, reTimer=null;
  function observar(){
    if(obs) return;
    obs=new MutationObserver(()=>{ if(!adminMode){ clearTimeout(reTimer); reTimer=setTimeout(aplicar, 120); } });
    obs.observe(document.body, {childList:true, subtree:true});
  }

  function init(){ insertarBoton(); setTimeout(()=>{ aplicar(); observar(); }, 400); }
  if(document.readyState==='loading'){ window.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
