import os
import re

file_path = "ecommerce-core/frontend/src/components/Dashboard.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
content = content.replace("const [messages, setMessages] = useState([]);", "const [messages, setMessages] = useState([]);\n  const [farmacias, setFarmacias] = useState([]);")
content = content.replace("const [currentEditingProduct, setCurrentEditingProduct] = useState(null);", "const [currentEditingProduct, setCurrentEditingProduct] = useState(null);\n  const [isFarmaciaModalOpen, setIsFarmaciaModalOpen] = useState(false);\n  const [currentEditingFarmacia, setCurrentEditingFarmacia] = useState(null);")
content = content.replace("  const API_URL = 'http://localhost:5000/api';", """  const [farmaciaForm, setFarmaciaForm] = useState({
    nombre: '',
    ciudad: '',
    sector: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    maps: '',
    logo: '',
    productos: [],
    activa: true
  });

  const API_URL = 'http://localhost:5000/api';""")

# 2. Add fetch
fetch_injection = """      // Fetch Farmacias
      try {
        const farmRes = await fetch(`${API_URL}/farmacias/admin`, { headers });
        const farmData = await farmRes.json();
        setFarmacias(Array.isArray(farmData) ? farmData : []);
      } catch(e) {
        setFarmacias([]);
      }

      // Fetch Web Config"""
content = content.replace("      // Fetch Web Config", fetch_injection)

# 3. Add handlers
handlers_injection = """  // FARMACIAS HANDLERS
  const handleOpenAddFarmacia = () => {
    setCurrentEditingFarmacia(null);
    setFarmaciaForm({ nombre:'', ciudad:'', sector:'', direccion:'', telefono:'', whatsapp:'', horario:'', maps:'', logo:'', productos:[], activa:true });
    setIsFarmaciaModalOpen(true);
  };
  const handleOpenEditFarmacia = (f) => {
    setCurrentEditingFarmacia(f);
    setFarmaciaForm({ nombre:f.nombre, ciudad:f.ciudad, sector:f.sector||'', direccion:f.direccion, telefono:f.telefono, whatsapp:f.whatsapp||'', horario:f.horario||'', maps:f.maps||'', logo:f.logo||'', productos:f.productos||[], activa:f.activa===1 });
    setIsFarmaciaModalOpen(true);
  };
  const handleFarmaciaSubmit = async (e) => {
    e.preventDefault();
    const url = currentEditingFarmacia ? `${API_URL}/farmacias/${currentEditingFarmacia.id}` : `${API_URL}/farmacias`;
    try {
      const res = await fetch(url, {
        method: currentEditingFarmacia ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(farmaciaForm)
      });
      if(res.ok) {
        alert('Farmacia guardada.');
        setIsFarmaciaModalOpen(false);
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al guardar');
      }
    } catch(err) { console.error(err); }
  };
  const handleDeleteFarmacia = async (id) => {
    if(!confirm('¿Eliminar farmacia?')) return;
    try {
      const res = await fetch(`${API_URL}/farmacias/${id}`, { method:'DELETE', headers:{ 'Authorization': `Bearer ${token}` } });
      if(res.ok) fetchDashboardData();
    } catch(err) { console.error(err); }
  };

  // 1. PRODUCT CRUD HANDLERS"""
content = content.replace("  // 1. PRODUCT CRUD HANDLERS", handlers_injection)

# 4. Add sidebar button
sidebar_btn = """            <button
              onClick={() => setActiveTab('farmacias')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'farmacias' 
                  ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Farmacias
            </button>

            <button
              onClick={() => setActiveTab('configuracion')}"""
content = content.replace("""            <button
              onClick={() => setActiveTab('configuracion')}""", sidebar_btn)

# 5. Add Tab content
tab_content = """              {/* TAB: FARMACIAS */}
              {activeTab === 'farmacias' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Puntos de Venta (Farmacias)</h2>
                      <p className="text-sm text-slate-500">Gestiona las farmacias aliadas mostradas en el localizador web.</p>
                    </div>
                    <button onClick={handleOpenAddFarmacia} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md flex items-center gap-1.5">
                      + Añadir Farmacia
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                            <th className="px-6 py-4">Farmacia</th>
                            <th className="px-6 py-4">Ubicación</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {farmacias.map(f => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-bold text-slate-800">
                                <div className="flex items-center gap-3">
                                  {f.logo && <img src={f.logo} alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-200"/>}
                                  <span>{f.nombre}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold capitalize text-slate-700">{f.ciudad}</div>
                                {f.sector && <div className="text-xs text-slate-500">{f.sector}</div>}
                                <div className="text-xs text-slate-400 truncate max-w-[150px] mt-0.5" title={f.direccion}>{f.direccion}</div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                <div>Tel: {f.telefono}</div>
                                {f.whatsapp && <div className="text-emerald-600 font-semibold">WA: {f.whatsapp}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${f.activa===1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  {f.activa === 1 ? 'Activa' : 'Inactiva'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleOpenEditFarmacia(f)} className="p-1.5 text-slate-500 hover:text-emerald-600">✎</button>
                                <button onClick={() => handleDeleteFarmacia(f.id)} className="p-1.5 text-slate-500 hover:text-red-600">✖</button>
                              </td>
                            </tr>
                          ))}
                          {farmacias.length === 0 && <tr><td colSpan="5" className="text-center py-6 text-slate-400">No hay farmacias registradas.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CONFIGURACIÓN */}"""
content = content.replace("              {/* TAB: CONFIGURACIÓN */}", tab_content)

# 6. Add modal
modal_content = """      {/* FARMACIA MODAL */}
      {isFarmaciaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">{currentEditingFarmacia ? 'Editar Farmacia' : 'Añadir Farmacia'}</h3>
              <button onClick={() => setIsFarmaciaModalOpen(false)} className="text-slate-400 hover:text-slate-600">✖</button>
            </div>
            <form onSubmit={handleFarmaciaSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre *</label>
                  <input required type="text" value={farmaciaForm.nombre} onChange={e=>setFarmaciaForm({...farmaciaForm, nombre:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ciudad *</label>
                  <input required type="text" value={farmaciaForm.ciudad} onChange={e=>setFarmaciaForm({...farmaciaForm, ciudad:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ej: Quito" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sector</label>
                  <input type="text" value={farmaciaForm.sector} onChange={e=>setFarmaciaForm({...farmaciaForm, sector:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ej: La Carolina" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono *</label>
                  <input required type="text" value={farmaciaForm.telefono} onChange={e=>setFarmaciaForm({...farmaciaForm, telefono:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp</label>
                  <input type="text" value={farmaciaForm.whatsapp} onChange={e=>setFarmaciaForm({...farmaciaForm, whatsapp:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dirección *</label>
                  <input required type="text" value={farmaciaForm.direccion} onChange={e=>setFarmaciaForm({...farmaciaForm, direccion:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Logo URL</label>
                  <input type="text" value={farmaciaForm.logo} onChange={e=>setFarmaciaForm({...farmaciaForm, logo:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Productos</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={farmaciaForm.productos.includes('cysprex')} onChange={e => { const checked = e.target.checked; setFarmaciaForm({...farmaciaForm, productos: checked ? [...farmaciaForm.productos, 'cysprex'] : farmaciaForm.productos.filter(p=>p!=='cysprex')})}} /> CYSPREX®</label>
                    <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={farmaciaForm.productos.includes('lubryn')} onChange={e => { const checked = e.target.checked; setFarmaciaForm({...farmaciaForm, productos: checked ? [...farmaciaForm.productos, 'lubryn'] : farmaciaForm.productos.filter(p=>p!=='lubryn')})}} /> Lubryn-E®</label>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={farmaciaForm.activa} onChange={e=>setFarmaciaForm({...farmaciaForm, activa:e.target.checked})} /> Activa (Pública)</label>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={()=>setIsFarmaciaModalOpen(false)} className="w-1/2 py-2 bg-slate-100 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="w-1/2 py-2 bg-emerald-600 text-white rounded-lg font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}"""
content = content.replace("""    </div>
  );
}""", modal_content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

