import React, { useEffect } from 'react';
import { initDiceBox } from '../../systems/diceSystem';

interface DiceRoller3DProps {
  id?: string;
}

export const DiceRoller3D: React.FC<DiceRoller3DProps> = ({ id = 'dice-box' }) => {
  useEffect(() => {
    initDiceBox(`#${id}`).catch(console.error);
  }, [id]);

  return (
    <div 
      id={id} 
      className="fixed inset-0 pointer-events-none z-[150]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
