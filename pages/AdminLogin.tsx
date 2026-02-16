
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storageService } from '../services/storageService';
import { Association, SecondaryAdmin } from '../types';

interface AdminLoginProps {
  onLogin: (id: string, name: string, adminId: string, adminName: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [internalId, setInternalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const assoc = await storageService.findAssociationByCode(code);
      if (!assoc) {
        setError('Associação não encontrada.');
        setIsLoading(false);
        return;
      }

      // Login Master (Administrador Geral usando o código da AE)
      if (!internalId.trim()) {
        if (assoc.adminPasswordHash === password) {
          onLogin(assoc.id, assoc.name, 'MASTER', 'Administrador Geral');
          navigate('/admin');
        } else {
          setError('Senha de Administrador Geral incorreta.');
        }
      } else {
        // Login de Admin Secundário (ADMIN-01, etc)
        const admins = await storageService.getAdminsByAssociation(assoc.id);
        const admin = admins.find(a => a.internalId.toUpperCase() === internalId.trim().toUpperCase());
        
        if (admin && admin.passwordHash === password) {
          onLogin(assoc.id, assoc.name, admin.id, admin.name);
          navigate('/admin');
        } else {
          setError('ID Interno ou Senha Pessoal incorretos.');
        }
      }
    } catch (err) {
      setError('Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Acesso à Gestão">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <i className="fas fa-user-shield text-3xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Painel de Controlo</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Identifique-se para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Código da AE (ex: AE-1234)</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-50"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ID Interno (Deixe vazio p/ Master)</label>
              <input
                type="text"
                placeholder="Ex: ADMIN-01"
                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-50"
                value={internalId}
                onChange={(e) => setInternalId(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha de Acesso</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase border border-red-100">
                <i className="fas fa-exclamation-circle mr-2"></i> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all active:scale-95"
            >
              {isLoading ? 'A Processar...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
