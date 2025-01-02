import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const themes = {
  default: {
    primary: '#1565C0',
    secondary: '#4A90E2',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#FF6347',
    border: '#eeeeee',
    success: '#00C853',
    error: '#FF6B6B',
    titleFont: undefined,
  },
  girly: {
    primary: '#FF69B4',
    secondary: '#FFB6C1',
    background: '#FFF0F5',
    surface: '#ffffff',
    text: '#FF1493',
    textSecondary: '#DB7093',
    accent: '#FF85CF',
    border: '#FFE4E1',
    success: '#FF69B4',
    error: '#FF1493',
    cardBackground: '#FFEBF3',
    headerBackground: '#FFC0CB',
    buttonBackground: '#FF69B4',
    buttonText: '#ffffff',
    iconTint: '#FF69B4',
    titleFont: 'Pacifico',
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'default' ? 'girly' : 'default');
  };

  const value = {
    theme: themes[currentTheme],
    toggleTheme,
    currentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 