import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const Footer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`p-3 text-center border-t ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
    }`}>
      <p className="text-sm">
        Powered by <span className="font-bold" style={{ color: '#ea580c' }}>CYBERPIU</span> • 
        Sistema PDV v1.0.0 • © 2024 Todos os direitos reservados
      </p>
    </div>
  );
};

export default Footer;