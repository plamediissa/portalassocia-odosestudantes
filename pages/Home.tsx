
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storageService } from '../services/storageService';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAssociations, setTotalAssociations] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      const count = await storageService.getTotalAssociationsCount();
      setTotalAssociations(count);
    };
    loadStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const assoc = await storageService.findAssociationByName(searchTerm);
      if (assoc) {
        navigate(`/view/${encodeURIComponent(assoc.name)}`);
      } else {
        setError('Associação não encontrada. Verifique o nome da escola ou associação.');
      }
    } catch (err) {
      setError('Erro ao pesquisar associação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-10">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            Plataforma de Confiança Académica
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
            Portal <br/><span className="text-indigo-600">Associação dos Estudantes.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            A plataforma definitiva para estudantes visualizarem e direções gerirem Associações de Estudantes em Angola.
          </p>

          {/* Contador de Associações */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex -space-x-3 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-slate-50 bg-slate-200 border border-white flex items-center justify-center overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-slate-500 text-sm font-bold">
              Junta-te a <span className="text-indigo-600 font-black text-lg">+{totalAssociations}</span> associações que já confiam em nós.
            </p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
             <i className="fas fa-search text-9xl"></i>
          </div>
          
          <h3 className="text-2xl font-black mb-8 text-center text-slate-800">Localiza a tua Escola ou Associação</h3>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-grow relative">
              <i className="fas fa-school absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="text"
                placeholder="Ex: Instituto Politécnico X ou AE-IPL..."
                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 text-lg font-bold text-slate-700 transition-all placeholder:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
            >
              {isLoading ? 'A pesquisar...' : 'Explorar Portal'}
            </button>
          </form>
          {error && (
            <div className="mt-6 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center mb-8 shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
              <i className="fas fa-plus-circle text-2xl"></i>
            </div>
            <h4 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">Sou da Direção</h4>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              Crie um perfil oficial para a sua AE, organize departamentos, publique estatutos e mantenha os estudantes informados.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/create')}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black hover:bg-black transition-all shadow-lg text-sm"
              >
                Registar Associação
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-black hover:text-indigo-800 transition-all py-3 px-4 text-sm"
              >
                Painel Administrativo <i className="fas fa-chevron-right ml-1 text-[10px]"></i>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl group text-white">
            <div className="w-16 h-16 bg-white/10 text-white rounded-[1.2rem] flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10 group-hover:-rotate-6 transition-transform">
              <i className="fas fa-fingerprint text-2xl text-indigo-400"></i>
            </div>
            <h4 className="text-2xl font-black mb-4 tracking-tight">Sou Estudante</h4>
            <p className="text-slate-400 mb-8 font-medium leading-relaxed">
              Acesso totalmente público e anónimo. Consulta atividades, membros da direção e documentos legais sem complicações.
            </p>
            <div className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">
              <i className="fas fa-check-circle"></i>
              <span>Privacidade Garantida</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
