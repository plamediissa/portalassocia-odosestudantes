
import React from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  extraHeaderContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, title, extraHeaderContent }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center text-xl sm:text-2xl font-bold tracking-tight hover:text-indigo-100 transition-colors">
            <i className="fas fa-graduation-cap mr-2"></i>
            Portal Associação dos Estudantes
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="hover:text-indigo-200 transition-colors text-sm sm:text-base font-medium">Início</Link>
            {extraHeaderContent}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {title && <h2 className="text-3xl font-bold mb-8 text-slate-800 border-b pb-4 tracking-tight">{title}</h2>}
        {children}
      </main>

      <footer className="bg-slate-800 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Portal Associação dos Estudantes - Simplificando a organização académica.</p>
          <p className="mt-2 italic text-slate-500">Desenvolvido para fortalecer a voz estudantil em Angola.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
