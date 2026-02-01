import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [dateTime, setDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3 flex-1 lg:flex-none">
        <div className="flex items-center gap-2 lg:ml-0">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-sm font-medium">
            A
          </div>
          <span className="text-base font-medium tracking-tight text-slate-900 hidden sm:inline">AutoColor System</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600 hidden sm:inline">{dateTime}</span>
        <button className="p-2 text-slate-400 hover:text-slate-600 relative" aria-label="Notificações">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
