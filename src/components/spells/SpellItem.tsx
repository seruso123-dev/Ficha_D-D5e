import React from 'react';
import { Spell } from '../../types';
import { Trash2, Zap } from 'lucide-react';
import { formatMod } from '../../utils/format';

interface SpellItemProps {
  spell: Spell;
  profBonus: number;
  spellcastingAbilityMod: number;
  updateSpell: (id: string, field: keyof Spell, value: any) => void;
  removeSpell: (id: string) => void;
  handleRoll: (formula: string | string[], label: string) => void;
}

export const SpellItem = React.memo(({ 
  spell, 
  profBonus, 
  spellcastingAbilityMod, 
  updateSpell, 
  removeSpell, 
  handleRoll 
}: SpellItemProps) => {
  return (
    <div className="bg-parchment/50 rounded-sm border border-gold/30 overflow-hidden group shadow-inner">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="col-span-1 flex justify-center">
          <div 
            onClick={() => updateSpell(spell.id, 'prepared', !spell.prepared)} 
            className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${spell.prepared ? 'bg-accent-red border-accent-red shadow-[0_0_8px_rgba(139,37,0,0.5)]' : 'border-gold/50'}`} 
          />
        </div>
        <div className="col-span-11 sm:col-span-4">
          <input type="text" value={spell.name} onChange={(e) => updateSpell(spell.id, 'name', e.target.value)} className="bg-transparent w-full font-bold outline-none focus:text-accent-red text-ink border-b border-transparent focus:border-gold/30" />
          <div className="text-[10px] uppercase font-bold text-ink/40">Nome da Magia</div>
        </div>
        <div className="col-span-4 sm:col-span-1">
          <input type="number" value={spell.level} onChange={(e) => updateSpell(spell.id, 'level', parseInt(e.target.value) || 0)} className="bg-transparent w-full font-bold text-center outline-none text-ink border-b border-transparent focus:border-gold/30" />
          <div className="text-[10px] uppercase font-bold text-ink/40 text-center">Nível</div>
        </div>
        <div className="col-span-6 sm:col-span-2">
          <input type="text" value={spell.school} onChange={(e) => updateSpell(spell.id, 'school', e.target.value)} className="bg-transparent w-full font-bold text-center outline-none text-ink border-b border-transparent focus:border-gold/30" />
          <div className="text-[10px] uppercase font-bold text-ink/40 text-center">Escola</div>
        </div>
        <div className="col-span-10 sm:col-span-3">
          <div className="flex gap-1">
            <input type="text" value={spell.damage || ''} onChange={(e) => updateSpell(spell.id, 'damage', e.target.value)} placeholder="Dano" className="bg-transparent flex-1 font-bold text-center outline-none text-ink border-b border-transparent focus:border-gold/30" />
            <button 
              onClick={() => {
                const attackBonus = profBonus + spellcastingAbilityMod;
                const formulas = [`1d20${formatMod(attackBonus)}`];
                if (spell.damage) formulas.push(spell.damage);
                handleRoll(formulas, spell.name);
              }}
              className="p-1 text-accent-red hover:scale-110 transition-transform"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] uppercase font-bold text-ink/40 text-center">Ataque/Dano</div>
        </div>
        <div className="col-span-2 sm:col-span-1 flex justify-end">
          <button onClick={() => removeSpell(spell.id)} className="text-ink/30 hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[8px] uppercase font-bold text-ink/50">Tempo</div>
          <input type="text" value={spell.castingTime} onChange={(e) => updateSpell(spell.id, 'castingTime', e.target.value)} className="ff-input w-full text-[10px] py-1" />
        </div>
        <div>
          <div className="text-[8px] uppercase font-bold text-ink/50">Alcance</div>
          <input type="text" value={spell.range} onChange={(e) => updateSpell(spell.id, 'range', e.target.value)} className="ff-input w-full text-[10px] py-1" />
        </div>
        <div>
          <div className="text-[8px] uppercase font-bold text-ink/50">Componentes</div>
          <input type="text" value={spell.components} onChange={(e) => updateSpell(spell.id, 'components', e.target.value)} className="ff-input w-full text-[10px] py-1" />
        </div>
        <div className="col-span-1 sm:col-span-3">
          <div className="text-[8px] uppercase font-bold text-ink/50 mb-1">Descrição</div>
          <textarea value={spell.description} onChange={(e) => updateSpell(spell.id, 'description', e.target.value)} className="ff-textarea w-full h-16 p-2 text-xs rounded-sm resize-none" placeholder="Efeitos da magia..." />
        </div>
      </div>
    </div>
  );
});
