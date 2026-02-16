
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storageService } from '../services/storageService';
import { Association } from '../types';

const angolaGeoData: Record<string, Record<string, string[]>> = {
  "Luanda": {
    "Belas": ["Kilamba", "Benfica", "Patriota"],
    "Cacuaco": ["Sede", "Kikolo", "Sequele"],
    "Cazenga": ["Tala Hady", "Hoji ya Henda"],
    "Kilamba Kiaxi": ["Golf 2", "Palanca", "Nova Vida"],
    "Luanda": ["Maianga", "Sambizanga", "Ingombota"],
    "Viana": ["Sede", "Zango", "Luanda Sul"]
  },
  "Benguela": { "Benguela": ["Sede", "Cassequel"], "Lobito": ["Canata", "Restinga"] },
  "Huambo": { "Huambo": ["Cidade Alta", "Fátima"] },
  "Huíla": { "Lubango": ["Lucrécia", "Arrifana"] }
};

const CreateAssociation: React.FC = () => {
  const [schoolName, setSchoolName] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ association: Association, pass: string } | null>(null);
  const navigate = useNavigate();

  const provinces = Object.keys(angolaGeoData).sort();
  const municipalities = province ? Object.keys(angolaGeoData[province]).sort() : [];
  const neighborhoods = (province && municipality) ? angolaGeoData[province][municipality].sort() : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!province || !municipality) { setError('Selecione a localização completa.'); return; }
    setIsLoading(true);
    try {
      const result = await storageService.createAssociation(schoolName, associationName, phone, { province, municipality, neighborhood });
      // Criar automaticamente os 4 admins base da direção
      await Promise.all([
        storageService.addAdmin({ internalId: 'ADMIN-01', associationId: result.association.id, name: 'Presidente', role: 'Presidente', grade: '12ª Classe', passwordHash: result.plainPassword }),
        storageService.addAdmin({ internalId: 'ADMIN-02', associationId: result.association.id, name: 'Vice-Presidente', role: 'Vice-Presidente', grade: '12ª Classe', passwordHash: result.plainPassword }),
        storageService.addAdmin({ internalId: 'ADMIN-03', associationId: result.association.id, name: 'Secretário Geral', role: 'Secretário Geral', grade: '11ª Classe', passwordHash: result.plainPassword }),
        storageService.addAdmin({ internalId: 'ADMIN-04', associationId: result.association.id, name: 'Tesoureiro', role: 'Tesoureiro', grade: '11ª Classe', passwordHash: result.plainPassword }),
      ]);
      setSuccessData({ association: result.association, pass: result.plainPassword });
    } catch (err) { setError('Erro ao criar associação.'); } finally { setIsLoading(false); }
  };

  if (successData) {
    return (
      <Layout title="Associação Registada">
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 p-10 text-center text-white">
              <i className="fas fa-key text-5xl mb-4"></i>
              <h3 className="text-2xl font-black">Chaves de Acesso Geradas</h3>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-2">Guarde estes dados com segurança</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Código da AE</p>
                  <p className="text-2xl font-black text-slate-900">{successData.association.registrationCode}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Senha Padrão Direção</p>
                  <p className="text-2xl font-mono font-black text-indigo-600">{successData.pass}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">IDs dos Administradores (Direção)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['ADMIN-01', 'ADMIN-02', 'ADMIN-03', 'ADMIN-04'].map(id => (
                    <div key={id} className="bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 text-center">
                      <p className="text-[9px] font-black text-indigo-600 uppercase">{id}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex gap-4">
                <i className="fas fa-triangle-exclamation text-amber-500 text-xl"></i>
                <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                  Os IDs de ADMIN são exclusivos para os membros da direção. O login master utiliza o Código da AE.
                </p>
              </div>

              <button onClick={() => navigate('/login')} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl hover:bg-black transition-all">Aceder ao Painel</button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nova Associação de Estudantes">
      <div className="max-w-lg mx-auto">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Escola</label><input type="text" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none" value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Associação</label><input type="text" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none" value={associationName} onChange={e => setAssociationName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Província</label><select required className="w-full px-4 py-4 bg-slate-50 border rounded-2xl font-bold" value={province} onChange={e => setProvince(e.target.value)}><option value="">Selecione...</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Município</label><select required className="w-full px-4 py-4 bg-slate-50 border rounded-2xl font-bold" value={municipality} onChange={e => setMunicipality(e.target.value)}><option value="">Selecione...</option>{municipalities.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone Direção</label><input type="tel" required className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none" placeholder="9XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            {error && <div className="text-red-500 text-[10px] font-black uppercase text-center">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black shadow-xl">Começar Agora</button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAssociation;
