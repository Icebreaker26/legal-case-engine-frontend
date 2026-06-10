import { createContext, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  
  // Explicitly check for all routes related to Tutelas/Derechos de Petición
  const isTutelas = [
    '/',
    '/procesar',
    '/entrenar',
    '/memoria',
    '/calendario',
    '/papelera',
    '/admin',
    '/informes',
    '/notificaciones',
    '/tutela'
  ].some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  
  // Default to dark-pro, force light only for Tutelas.
  const theme = isTutelas ? 'light' : 'dark-pro';

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
