
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { storageService } from '../services/storageService';
import { Department, Association, Event, SecondaryAdmin } from '../types';

type PublicTab = 'departments' | 'associates' | 'events' | 'board' | 'complaints';
const GRADES = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];
const TECHNICAL_GRADES = ['10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];

const PublicView: React.FC = () => {
  const { associationName } = useParams<{ associationName: string }>();
  const [association, setAssociation] = useState<Association | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [admins, setAdmins] = useState<SecondaryAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PublicTab>('departments');

  // Form states (Ouvidoria)
  const [compName, setCompName] = useState('');
  const [compGrade, setCompGrade] = useState(GRADES[0]);
  const [compCourse, setCompCourse] = useState('');
  const [compMsg, setCompMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!associationName) return;
      try {
        const name = decodeURIComponent(associationName);
        const assoc = await storageService.findAssociationByName(name);
        if (assoc) {
          setAssociation(assoc);
          storageService.recordView(assoc.id);
          const [depts, evs, ads] = await Promise.all([
            storageService.getDepartmentsByAssociation(assoc.id),
            storageService.getEventsByAssociation(assoc.id),
            storageService.getAdminsByAssociation(assoc.id)
          ]);
          setDepartments(depts);
          setEvents(evs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          setAdmins(ads);
        }
      } catch (err) {} finally { setIsLoading(false); }
    };
    fetchData();
  }, [associationName]);

  // Lógica de Deduplicação de Associados
  const allAssociatesList = useMemo(() => {
    if (!association) return [];
    const map = new Map<string, any>();
    const add = (name: string, role: string, grade: string, course: string, photo: string, type: string) => {
      if (!name || !name.trim()) return;
      const normalized = name.trim().toLowerCase();
      if (!map.has(normalized)) map.set(normalized, { name: name.trim(), role, grade, course, photo, type });
    };
    
    // Direção Executiva
    ['president', 'vicePresident', 'secretary', 'treasurer'].forEach(r => {
       const n = (association as any)[r];
       const label = r === 'president' ? 'Presidente' : r === 'vicePresident' ? 'Vice-Presidente' : r === 'secretary' ? 'Secretário' : 'Tesoureiro';
       if (n) add(n, label, (association as any)[`${r}Grade`], (association as any)[`${r}Course`], (association as any)[`${r}Photo`], 'Executiva');
    });

    admins.forEach(a => add(a.name, a.role, a.grade, a.course || '', a.photoData || '', 'Admin'));
    departments.forEach(d => {
       if (d.coordinator) add(d.coordinator, `Coord. ${d.name}`, d.coordinatorGrade || '', d.coordinatorCourse || '', d.coordinatorPhoto || '', 'Equipa');
       d.members?.forEach(m => add(m.name, m.role, m.grade, m.course || '', m.photoData || '', 'Equipa'));
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [association, admins, departments]);

  const handleSendComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!association || isSending) return;
    setIsSending(true);
    try {
      await storageService.addComplaint({ associationId: association.id, studentName: compName, grade: compGrade, course: compCourse, message: compMsg });
      alert("Sua mensagem foi enviada à Direção com sucesso!");
      setCompName(''); setCompMsg(''); setCompCourse('');
    } catch (err) { alert("Erro ao enviar mensagem."); } finally { setIsSending(false); }
  };

  if (isLoading) return <Layout><div className="py-24 text-center font-bold text-slate-400">A carregar portal estudantil...</div></Layout>;

  return (
    <Layout extraHeaderContent={<Link to="/login" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100">Área Reservada</Link>}>
      <div className="mb-12 flex flex-col items-center animate-in fade-in duration-1000">
        <div className="flex gap-4 items-center mb-6">
          <div className="w-20 h-20 bg-white p-2 rounded-2xl shadow-xl border overflow-hidden">{association?.schoolLogoData ? <img src={association.schoolLogoData} className="w-full h-full object-contain" /> : <i className="fas fa-school text-slate-100 text-2xl"></i>}</div>
          <div className="w-24 h-24 bg-white p-3 rounded-3xl shadow-2xl border-4 border-white overflow-hidden">{association?.logoData ? <img src={association.logoData} className="w-full h-full object-contain" /> : <i className="fas fa-graduation-cap text-indigo-100 text-4xl"></i>}</div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center">{association?.name}</h2>
        <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px] mt-2 border-b border-indigo-100 pb-2">{association?.schoolName}</p>
      </div>

      <div className="flex justify-center mb-12 sticky top-4 z-40 px-4">
        <div className="inline-flex p-1.5 bg-white/80 backdrop-blur-xl border shadow-2xl rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {(['departments', 'associates', 'events', 'board', 'complaints'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'departments' ? 'Equipas' : tab === 'events' ? 'Agenda' : tab === 'board' ? 'Direção' : tab === 'associates' ? 'Associados' : 'Ouvidoria'}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-500 pb-20">
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-6xl mx-auto">
            {events.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest">Nenhum evento agendado.</div>}
            {events.map(ev => (
              <div key={ev.id} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                <div className="h-48 bg-slate-50 relative overflow-hidden">
                   {ev.imageData ? <img src={ev.imageData} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-slate-100 text-5xl"><i className="fas fa-calendar-day"></i></div>}
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm"><p className="text-[10px] font-black text-indigo-600 uppercase">{new Date(ev.date).toLocaleDateString('pt-PT')}</p></div>
                </div>
                <div className="p-8">
                   <h4 className="text-2xl font-black text-slate-900 leading-none">{ev.title}</h4>
                   <p className="text-indigo-500 font-bold text-[10px] uppercase mt-3 flex items-center gap-2"><i className="fas fa-location-dot"></i> {ev.location}</p>
                   <p className="text-slate-500 text-sm mt-5 leading-relaxed font-medium line-clamp-4">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'board' && (
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            {['president', 'vicePresident', 'secretary', 'treasurer'].map(role => {
               const name = (association as any)[role];
               if (!name) return null;
               const label = role === 'president' ? 'Presidente' : role === 'vicePresident' ? 'Vice-Presidente' : role === 'secretary' ? 'Secretário' : 'Tesoureiro';
               return (
                 <div key={role} className="bg-white p-8 rounded-[3rem] border shadow-sm flex items-center gap-8 group hover:border-indigo-200 transition-colors">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-indigo-50 shadow-inner shrink-0">
                       {(association as any)[`${role}Photo`] ? <img src={(association as any)[`${role}Photo`]} className="w-full h-full object-cover" /> : <i className="fas fa-user-tie text-slate-200 text-4xl flex items-center justify-center h-full"></i>}
                    </div>
                    <div>
                       <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{label}</span>
                       <h4 className="text-2xl font-black text-slate-900 mt-3">{name}</h4>
                       <p className="text-slate-400 text-xs font-bold uppercase mt-1">{(association as any)[`${role}Grade`]} { (association as any)[`${role}Course`] && `• ${(association as any)[`${role}Course`]}` }</p>
                    </div>
                 </div>
               );
            })}
          </div>
        )}

        {activeTab === 'associates' && (
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allAssociatesList.map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 mb-4 overflow-hidden border group-hover:border-indigo-400 transition-all">
                    {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-slate-200 flex items-center justify-center h-full text-2xl"></i>}
                  </div>
                  <h5 className="font-black text-slate-900 leading-tight">{m.name}</h5>
                  <p className="text-indigo-500 font-bold text-[10px] uppercase mt-2 tracking-widest">{m.role}</p>
                  <div className="mt-5 pt-5 border-t w-full text-[9px] font-black text-slate-400 uppercase">{m.grade} {m.course && `• ${m.course}`}</div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map(d => (
              <div key={d.id} className="bg-white p-10 rounded-[3rem] border shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-4xl group-hover:scale-125 transition-transform"><i className="fas fa-users-rectangle"></i></div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">{d.name}</h4>
                <div className="space-y-6">
                  {d.coordinator && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl overflow-hidden border shadow-inner">
                        {d.coordinatorPhoto ? <img src={d.coordinatorPhoto} className="w-full h-full object-cover" /> : <i className="fas fa-user-tie text-indigo-200 flex items-center justify-center h-full"></i>}
                      </div>
                      <div><p className="text-[10px] font-black uppercase text-indigo-600">Coordenador</p><p className="font-bold text-slate-800 text-sm leading-tight">{d.coordinator}</p></div>
                    </div>
                  )}
                  {d.members.length > 0 && (
                    <div className="pt-4 border-t border-slate-50">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Equipa Efetiva ({d.members.length} membros)</p>
                       <div className="flex -space-x-3">
                         {d.members.slice(0, 5).map(m => (
                           <div key={m.id} className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-sm" title={m.name}>
                             {m.photoData ? <img src={m.photoData} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-400">{m.name.charAt(0)}</span>}
                           </div>
                         ))}
                         {d.members.length > 5 && <div className="w-10 h-10 bg-indigo-600 text-white rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">+{d.members.length - 5}</div>}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="max-w-2xl mx-auto px-4">
             <div className="bg-white p-10 md:p-14 rounded-[4rem] border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                <h4 className="text-3xl font-black mb-4 text-center text-slate-900">Ouvidoria Estudantil</h4>
                <p className="text-center text-slate-400 font-medium mb-12 text-sm leading-relaxed">Espaço seguro para enviar sugestões ou denúncias à Direção. Sua voz é fundamental para a melhoria da nossa instituição.</p>
                <form onSubmit={handleSendComplaint} className="space-y-8">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teu Nome Completo</label><input type="text" required className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={compName} onChange={e => setCompName(e.target.value)} /></div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tua Classe</label><select className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-3xl font-bold outline-none cursor-pointer" value={compGrade} onChange={e => setCompGrade(e.target.value)}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                      {TECHNICAL_GRADES.includes(compGrade) && <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teu Curso</label><input type="text" className="w-full px-6 py-4.5 bg-indigo-50 border border-indigo-100 rounded-3xl font-bold outline-none" value={compCourse} onChange={e => setCompCourse(e.target.value)} /></div>}
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mensagem para a Direção</label><textarea required className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold h-40 resize-none outline-none focus:ring-4 focus:ring-indigo-50" placeholder="O que pretendes comunicar?" value={compMsg} onChange={e => setCompMsg(e.target.value)} /></div>
                   <button type="submit" disabled={isSending} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black shadow-2xl hover:bg-black transition-all disabled:opacity-50 tracking-widest uppercase text-sm">
                     {isSending ? 'A enviar...' : 'Enviar Mensagem Agora'}
                   </button>
                   <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2"><i className="fas fa-shield-halved"></i> Comunicação encriptada e segura</p>
                </form>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PublicView;
