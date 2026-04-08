import React, { createContext, useContext } from 'react';

export const SidebarOpenContext = createContext(false);

export function SidebarNameTruncate({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useContext(SidebarOpenContext);
  return (
    <div className={`font-semibold text-base md:text-lg ${sidebarOpen ? 'truncate' : 'break-words'}`}>{children}</div>
  );
}