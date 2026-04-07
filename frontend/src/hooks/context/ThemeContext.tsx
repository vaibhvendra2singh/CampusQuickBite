/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleTheme: () => { } });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isDark = true; // Dark mode is the absolute only theme

    useEffect(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('campusbite-theme', 'dark');
    }, []);

    const toggleTheme = () => { /* No-op: only dark mode allowed */ };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
