
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { AuthState, Department, Event, SecondaryAdmin, Association, DepartmentMember, Complaint } from '../types';
import { storageService } from '../services/storageService';
// @ts-ignore
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';
// @ts-ignore
import autoTable from 'https://esm.sh/jspdf-autotable@3.8.2';

interface AdminDashboardProps {
  auth: AuthState;
  onLogout: () => void;
}

type Tab = 'departments' | 'events' | 'admins' | 'complaints' | 'stats' | 'reports' | 'settings';

const GRADES = ['7ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe', '13ª Classe'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ auth, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [admins, setAdmins] = useState<SecondaryAdmin[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [association, setAssociation] = useState<Association | null>(null);
  const [viewStats, setViewStats] = useState({ today: 0, week: 0, month: 0, year: 0 });
  const [satisfaction, setSatisfaction] = useState({ positive: 0, negative: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [showModal, setShowModal] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // States para Gestão de Membros de Departamento
  const [tempMembers, setTempMembers] = useState<DepartmentMember[]>([]);
  const [newMemberData, setNewMemberData] = useState<any>({ name: '', role: '', grade: GRADES[0], course: '' });
  
  // States para Configurações
  const [boardData, setBoardData] = useState<any>({});
  const [assocName, setAssocName] = useState('');
  const [assocSchool, setAssocSchool] = useState('');
  const [phoneData, setPhoneData] = useState('');
  const [docData, setDocData] = useState<any>({});

  useEffect(() => {
    loadAllData();
  }, [auth.associationId]);

  const loadAllData = async () => {
    if (auth.associationId) {
      const [depts, evs, ads, assoc, comps, vStats, sStats] = await Promise.all([
        storageService.getDepartmentsByAssociation(auth.associationId),
        storageService.getEventsByAssociation(auth.associationId),
        storageService.getAdminsByAssociation(auth.associationId),
        storageService.findAssociationByName(auth.associationName || ''),
        storageService.getComplaintsByAssociation(auth.associationId),
        storageService.getViewStats(auth.associationId),
        storageService.getSatisfactionStats(auth.associationId)
      ]);
      setDepartments(depts);
      setEvents(evs);
      setAdmins(ads);
      setComplaints(comps);
      setAssociation(assoc || null);
      setViewStats(vStats);
      setSatisfaction(sStats);
      if (assoc) {
        setAssocName(assoc.name || '');
        setAssocSchool(assoc.schoolName || '');
        setBoardData({
          president: assoc.president || '', presidentGrade: assoc.presidentGrade || GRADES[0], presidentCourse: assoc.presidentCourse || '', presidentPhoto: assoc.presidentPhoto || '',
          vicePresident: assoc.vicePresident || '', vicePresidentGrade: assoc.vicePresidentGrade || GRADES[0], vicePresidentCourse: assoc.vicePresidentCourse || '', vicePresidentPhoto: assoc.vicePresidentPhoto || '',
          secretary: assoc.secretary || '', secretaryGrade: assoc.secretaryGrade || GRADES[0], secretaryCourse: assoc.secretaryCourse || '', secretaryPhoto: assoc.secretaryPhoto || '',
          treasurer: assoc.treasurer || '', treasurerGrade: assoc.treasurerGrade || GRADES[0], treasurerCourse: assoc.treasurerCourse || '', treasurerPhoto: assoc.treasurerPhoto || ''
        });
        setPhoneData(assoc.phone || '');
        setDocData({
          logoData: assoc.logoData || '',
          schoolLogoData: assoc.schoolLogoData || '',
          statuteData: assoc.statuteData || '',
          contractData: assoc.contractData || '',
          responsibilityTermData: assoc.responsibilityTermData || ''
        });
      }
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.associationId || isProcessing) return;
    setIsProcessing(true);
    try {
      if (showModal === 'departments') {
        const data = { ...formData, members: tempMembers, associationId: auth.associationId };
        if (editingId) await storageService.updateDepartment(editingId, data);
        else await storageService.addDepartment(data);
      } else if (showModal === 'events') {
        const data = { ...formData, associationId: auth.associationId };
        if (editingId) await storageService.updateEvent(editingId, data);
        else await storageService.addEvent(data);
      } else if (showModal === 'admins') {
        const data = { ...formData, associationId: auth.associationId };
        if (editingId) await storageService.updateAdmin(editingId, data);
        else await storageService.addAdmin(data);
      }
      setShowModal(null); setEditingId(null); setFormData({}); setTempMembers([]);
      loadAllData();
    } catch (err) { alert("Erro ao salvar."); } finally { setIsProcessing(false); }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.associationId) return;
    try {
      await storageService.updateAssociation(auth.associationId, {
        name: assocName, schoolName: assocSchool, phone: phoneData, ...boardData, ...docData
      });
      alert("Definições guardadas com sucesso!");
      loadAllData();
    } catch (err) { alert("Erro ao salvar."); }
  };

  const allAssociatesList = useMemo(() => {
    const associatesMap = new Map<string, { name: string; role: string; grade: string; course: string; category: string }>();
    const addUnique = (member: { name: string; role: string; grade: string; course: string; category: string }) => {
      if (!member.name || !member.name.trim()) return;
      const normalized = member.name.trim().toLowerCase();
      if (!associatesMap.has(normalized)) {
        associatesMap.set(normalized, { ...member, name: member.name.trim() });
      }
    };
    if (association) {
      [{n: association.president, r: 'Presidente', g: association.presidentGrade, c: association.presidentCourse},
       {n: association.vicePresident, r: 'Vice-Presidente', g: association.vicePresidentGrade, c: association.vicePresidentCourse},
       {n: association.secretary, r: 'Secretário', g: association.secretaryGrade, c: association.secretaryCourse},
       {n: association.treasurer, r: 'Tesoureiro', g: association.treasurerGrade, c: association.treasurerCourse}].forEach(m => {
        if (m.n) addUnique({ name: m.n, role: m.r, grade: m.g || '', category: 'Executiva', course: m.c || '' });
      });
    }
    admins.forEach(a => addUnique({ name: a.name, role: a.role, grade: a.grade, category: 'Admin', course: a.course || '' }));
    departments.forEach(d => {
      if (d.coordinator) addUnique({ name: d.coordinator, role: `Coord. ${d.name}`, grade: d.coordinatorGrade || '', category: 'Equipa', course: d.coordinatorCourse || '' });
      if (d.deputy) addUnique({ name: d.deputy, role: `Adjunto ${d.name}`, grade: d.deputyGrade || '', category: 'Equipa', course: d.deputyCourse || '' });
      d.members.forEach(m => addUnique({ name: m.name, role: m.role, grade: m.grade, category: 'Equipa', course: m.course || '' }));
    });
    return Array.from(associatesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [association, admins, departments]);

  const generatePDF = (type: 'associates' | 'departments') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(67, 56, 202);
    doc.text(association?.name?.toUpperCase() || 'ASSOCIAÇÃO', 14, 20);
    if (type === 'associates') {
      const data = allAssociatesList.map(a => [a.name, a.role, a.grade, a.course || '-', a.category]);
      autoTable(doc, { startY: 30, head: [['Nome', 'Cargo', 'Classe', 'Curso', 'Cat.']], body: data });
    } else {
      const data = departments.map(d => [d.name, d.coordinator || '-', d.members.length]);
      autoTable(doc, { startY: 30, head: [['Depto', 'Coordenador', 'Total Membros']], body: data });
    }
    doc.save(`${type}_ae.pdf`);
  };

  const addTempMember = () => {
    if (!newMemberData.name || !newMemberData.role) return;
    setTempMembers([...tempMembers, { ...newMemberData, id: Math.random().toString(36).substr(2, 9) }]);
    setNewMemberData({ name: '', role: '', grade: GRADES[0], course: '' });
  };

  const FileUpload = ({ label, current, onUpload }: { label: string, current?: string, onUpload: (base64: string) => void }) => (
    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-indigo-100 flex flex-col items-center text-center">
      <i className={`fas ${current ? 'fa-file-circle-check text-emerald-500' : 'fa-file-arrow-up text-slate-300'} text-3xl mb-3`}></i>
      <p className="text-[10px] font-black uppercase text-slate-500 mb-2">{label}</p>
      <label className="bg-white border px-4 py-2 rounded-xl text-[9px] font-black uppercase cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
        {current ? 'Substituir' : 'Carregar'}
        <input type="file" className="hidden" accept=".pdf,image/*" onChange={async (e) => {
          const f = e.target.files?.[0]; if (f) {
            const r = new FileReader(); r.onloadend = () => onUpload(r.result as string); r.readAsDataURL(f);
          }
        }} />
      </label>
    </div>
  );

  const PhotoUpload = ({ current, onUpload, label, isCircular = true }: any) => (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 bg-slate-100 ${isCircular ? 'rounded-full' : 'rounded-2xl'} border-2 border-indigo-100 overflow-hidden flex items-center justify-center relative group`}>
        {current ? <img src={current} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-slate-200"></i>}
        <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]; if (f) {
              const r = new FileReader(); r.onloadend = () => onUpload(r.result as string); r.readAsDataURL(f);
            }
          }} /><i className="fas fa-camera text-[10px]"></i>
        </label>
      </div>
      <span className="text-[7px] font-black uppercase text-slate-400">{label}</span>
    </div>
  );

  return (
    <Layout title={`Portal Gestão: ${auth.associationName}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="bg-indigo-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-indigo-100">
           <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-user-shield"></i></div>
           <div><p className="text-[9px] font-black uppercase text-indigo-400">Sessão de:</p><p className="text-sm font-black text-slate-800">{auth.adminName}</p></div>
        </div>
        
        <div className="flex bg-white rounded-2xl shadow-sm border p-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {(['stats', 'departments', 'events', 'admins', 'complaints', 'reports', 'settings'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              {tab === 'stats' ? 'Dados' : tab === 'departments' ? 'Equipas' : tab === 'events' ? 'Agenda' : tab === 'admins' ? 'Admins' : tab === 'complaints' ? 'Ouvidoria' : tab === 'reports' ? 'Listas' : 'Config'}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="bg-slate-100 text-red-600 px-6 py-2.5 rounded-xl font-black text-xs hover:bg-red-50">Sair</button>
      </div>

      {!isLoading && (
        <div className="animate-in fade-in duration-500">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-20">
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Visitas Hoje</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">{viewStats.today}</h3></div>
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Este Mês</p><h3 className="text-5xl font-black text-indigo-600 tracking-tighter">{viewStats.month}</h3></div>
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Satisfação</p><h3 className="text-5xl font-black text-emerald-500 tracking-tighter">{satisfaction.percentage}%</h3></div>
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Votos Totais</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter">{satisfaction.total}</h3></div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="flex justify-end"><button onClick={() => { setShowModal('departments'); setEditingId(null); setFormData({ coordinatorGrade: GRADES[0] }); setTempMembers([]); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">Novo Departamento</button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {departments.map(d => (
                  <div key={d.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm group">
                    <h4 className="font-black text-xl text-slate-900 mb-6">{d.name}</h4>
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><i className="fas fa-crown"></i></div><div><p className="text-[8px] font-black uppercase text-slate-400">Coordenador</p><p className="font-bold text-xs">{d.coordinator}</p></div></div>
                       <div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><i className="fas fa-users"></i></div><div><p className="text-[8px] font-black uppercase text-slate-400">Efetivos</p><p className="font-bold text-xs">{d.members.length + 2} Pessoas</p></div></div>
                    </div>
                    <div className="flex gap-2 pt-6 border-t"><button onClick={() => { setEditingId(d.id); setFormData(d); setTempMembers(d.members || []); setShowModal('departments'); }} className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase">Gerir Equipa</button><button onClick={() => storageService.deleteDepartment(d.id).then(loadAllData)} className="p-3 text-red-500"><i className="fas fa-trash"></i></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 pb-20">
               <div className="flex justify-between items-center">
                 <h4 className="font-black text-xl uppercase tracking-widest text-slate-800">Relatórios de Associados Únicos</h4>
                 <div className="flex gap-3">
                   <button onClick={() => generatePDF('associates')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">Descarregar PDF Geral</button>
                   <button onClick={() => generatePDF('departments')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">Lista de Deptos</button>
                 </div>
               </div>
               <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 border-b">
                     <tr><th className="px-6 py-5 font-black uppercase text-slate-400">Nome</th><th className="px-6 py-5 font-black uppercase text-slate-400">Cargo Principal</th><th className="px-6 py-5 font-black uppercase text-slate-400">Classe</th><th className="px-6 py-5 font-black uppercase text-slate-400 text-right">Cat.</th></tr>
                   </thead>
                   <tbody className="divide-y">
                     {allAssociatesList.map((m, i) => (
                       <tr key={i} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-bold text-slate-800">{m.name}</td>
                         <td className="px-6 py-4 text-slate-500">{m.role}</td>
                         <td className="px-6 py-4 text-slate-400 font-bold">{m.grade}</td>
                         <td className="px-6 py-4 text-right"><span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">{m.category}</span></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
                  <h4 className="font-black text-2xl mb-10 flex items-center gap-3 text-slate-800"><i className="fas fa-gears text-indigo-600"></i> Gestão Estrutural</h4>
                  <form onSubmit={handleSettingsSubmit} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Escola</label><input type="text" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={assocSchool} onChange={e => setAssocSchool(e.target.value)} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Associação</label><input type="text" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={assocName} onChange={e => setAssocName(e.target.value)} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone</label><input type="text" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl font-bold" value={phoneData} onChange={e => setPhoneData(e.target.value)} /></div>
                       </div>
                       <div className="flex gap-4 justify-center bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-indigo-100">
                          <PhotoUpload label="Logo AE" current={docData.logoData} onUpload={(b: any) => setDocData({...docData, logoData: b})} />
                          <PhotoUpload label="Escola" current={docData.schoolLogoData} onUpload={(b: any) => setDocData({...docData, schoolLogoData: b})} />
                       </div>
                    </div>

                    <div className="pt-10 border-t">
                       <h5 className="font-black text-xs uppercase text-slate-400 tracking-widest mb-8">Repositório de Documentos Oficiais</h5>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FileUpload label="Estatuto Social" current={docData.statuteData} onUpload={(b) => setDocData({...docData, statuteData: b})} />
                          <FileUpload label="Contrato de Adesão" current={docData.contractData} onUpload={(b) => setDocData({...docData, contractData: b})} />
                          <FileUpload label="Termo Responsabilidade" current={docData.responsibilityTermData} onUpload={(b) => setDocData({...docData, responsibilityTermData: b})} />
                       </div>
                    </div>

                    <div className="pt-10 border-t">
                      <h5 className="font-black text-xs uppercase text-slate-400 tracking-widest mb-10">Conselho Executivo (Direção)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(['president', 'vicePresident', 'secretary', 'treasurer'] as const).map(role => (
                          <div key={role} className="flex gap-4 items-center bg-slate-50/50 p-6 rounded-3xl border group hover:border-indigo-200 transition-all">
                             <PhotoUpload label="" current={boardData[`${role}Photo`]} onUpload={(b: any) => setBoardData({...boardData, [`${role}Photo`]: b})} />
                             <div className="flex-grow space-y-2">
                               <p className="text-[8px] font-black uppercase text-indigo-600">{role === 'president' ? 'Presidente' : role === 'vicePresident' ? 'Vice-Presidente' : role === 'secretary' ? 'Secretário' : 'Tesoureiro'}</p>
                               <input type="text" placeholder="Nome do Titular" className="w-full px-4 py-2 bg-white border rounded-xl font-bold text-xs outline-none" value={boardData[role]} onChange={e => setBoardData({...boardData, [role]: e.target.value})} />
                               <select className="w-full px-2 py-2 bg-white border rounded-xl font-bold text-[9px] outline-none" value={boardData[`${role}Grade`]} onChange={e => setBoardData({...boardData, [`${role}Grade`]: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-10 border-t"><button type="submit" className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-xl hover:bg-indigo-700 transition-all">Guardar Configurações</button></div>
                  </form>
               </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex justify-end"><button onClick={() => { setShowModal('admins'); setEditingId(null); setFormData({ grade: GRADES[0] }); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">Novo Administrador</button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {admins.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-lg shadow-inner overflow-hidden">
                      {a.photoData ? <img src={a.photoData} className="w-full h-full object-cover" /> : a.internalId.charAt(0)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-[9px] font-black uppercase text-indigo-500 mb-1">{a.internalId}</p>
                      <h5 className="font-black text-slate-800 leading-none">{a.name}</h5>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{a.role}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingId(a.id); setFormData({ ...a }); setShowModal('admins'); }} className="text-indigo-600"><i className="fas fa-edit"></i></button>
                      <button onClick={() => storageService.deleteAdmin(a.id).then(loadAllData)} className="text-red-500"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DEPARTAMENTOS */}
      {showModal === 'departments' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-slate-800">Equipa do Departamento</h3><button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button></div>
            <div className="p-8 space-y-8 overflow-y-auto">
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome do Departamento</label><input type="text" required className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-black outline-none" placeholder="Ex: Cultura e Recreação" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
               
               <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border">
                  <div className="space-y-4"><p className="text-[9px] font-black uppercase text-indigo-600">Coordenador</p><PhotoUpload label="Foto" current={formData.coordinatorPhoto} onUpload={(b: any) => setFormData({...formData, coordinatorPhoto: b})} /><input type="text" placeholder="Nome Completo" className="w-full px-4 py-2 border rounded-xl font-bold text-xs outline-none" value={formData.coordinator || ''} onChange={e => setFormData({...formData, coordinator: e.target.value})} /></div>
                  <div className="space-y-4"><p className="text-[9px] font-black uppercase text-indigo-600">Adjunto</p><PhotoUpload label="Foto" current={formData.deputyPhoto} onUpload={(b: any) => setFormData({...formData, deputyPhoto: b})} /><input type="text" placeholder="Nome Completo" className="w-full px-4 py-2 border rounded-xl font-bold text-xs outline-none" value={formData.deputy || ''} onChange={e => setFormData({...formData, deputy: e.target.value})} /></div>
               </div>

               <div className="pt-6 border-t">
                  <h5 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2"><i className="fas fa-users-line"></i> Adicionar Membros Efetivos</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/30 p-5 rounded-[2rem] border border-indigo-100">
                     <input type="text" placeholder="Nome" className="px-4 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newMemberData.name} onChange={e => setNewMemberData({...newMemberData, name: e.target.value})} />
                     <input type="text" placeholder="Cargo (ex: Vogal)" className="px-4 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newMemberData.role} onChange={e => setNewMemberData({...newMemberData, role: e.target.value})} />
                     <select className="px-4 py-3 bg-white border rounded-xl font-bold text-xs outline-none" value={newMemberData.grade} onChange={e => setNewMemberData({...newMemberData, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                     <button type="button" onClick={addTempMember} className="bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">Adicionar à Lista</button>
                  </div>
                  
                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                     {tempMembers.length === 0 && <p className="text-center text-slate-300 text-[10px] font-bold italic py-4">Nenhum membro adicionado além da coordenação.</p>}
                     {tempMembers.map(m => (
                       <div key={m.id} className="flex justify-between items-center p-3 bg-white border rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">{m.name.charAt(0)}</div><div><p className="font-black text-[10px] text-slate-800 leading-none">{m.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{m.role} • {m.grade}</p></div></div>
                          <button type="button" onClick={() => setTempMembers(tempMembers.filter(tm => tm.id !== m.id))} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-times"></i></button>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="flex gap-4 sticky bottom-0 bg-white pt-4"><button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black uppercase text-xs">Cancelar</button><button type="button" onClick={handleFormSubmit} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs">Guardar Departamento</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMINS */}
      {showModal === 'admins' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-black uppercase tracking-widest text-sm text-slate-800">Gerir Acesso Admin</h3><button onClick={() => setShowModal(null)} className="text-slate-400"><i className="fas fa-times"></i></button></div>
             <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">ID Interno (ex: ADMIN-01)</label><input type="text" required className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-black outline-none focus:ring-4 focus:ring-indigo-50" value={formData.internalId || ''} onChange={e => setFormData({...formData, internalId: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label><input type="text" required className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-black outline-none focus:ring-4 focus:ring-indigo-50" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cargo</label><input type="text" required className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-black outline-none focus:ring-4 focus:ring-indigo-50" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha de Acesso</label><input type="password" required className="w-full px-5 py-3 bg-slate-50 border rounded-xl font-black outline-none focus:ring-4 focus:ring-indigo-50" value={formData.passwordHash || ''} onChange={e => setFormData({...formData, passwordHash: e.target.value})} /></div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Guardar Acesso</button>
             </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
