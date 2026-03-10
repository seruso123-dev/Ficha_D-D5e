import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronRight,
  Info,
  Settings,
  User,
  ScrollText,
  Backpack,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterData, INITIAL_DATA, Ability, Skill, Attack, InventoryItem, Spell } from './types';

const ABILITY_LABELS: Record<Ability, string> = {
  FOR: 'Força',
  DES: 'Destreza',
  CON: 'Constituição',
  INT: 'Inteligência',
  SAB: 'Sabedoria',
  CAR: 'Carisma'
};

const getMod = (score: number) => Math.floor((score - 10) / 2);
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod.toString());

export default function App() {
  const [char, setChar] = useState<CharacterData>(() => {
    const saved = localStorage.getItem('dnd_character_sheet');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DATA,
          ...parsed,
          spellSlots: parsed.spellSlots || INITIAL_DATA.spellSlots,
          inventory: parsed.inventory || INITIAL_DATA.inventory,
          spells: parsed.spells || INITIAL_DATA.spells,
          skills: parsed.skills ? parsed.skills.map((s: any) => ({ ...s, miscBonus: s.miscBonus || 0 })) : INITIAL_DATA.skills,
          spellcastingAbility: parsed.spellcastingAbility || INITIAL_DATA.spellcastingAbility
        };
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  const [profBonus, setProfBonus] = useState(2);
  const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'equipment' | 'features'>('combat');

  // Auto-save
  useEffect(() => {
    localStorage.setItem('dnd_character_sheet', JSON.stringify(char));
  }, [char]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${char.name || 'personagem'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setChar({
          ...INITIAL_DATA,
          ...json,
          spellSlots: json.spellSlots || INITIAL_DATA.spellSlots,
          inventory: json.inventory || INITIAL_DATA.inventory,
          spells: json.spells || INITIAL_DATA.spells,
          skills: json.skills ? json.skills.map((s: any) => ({ ...s, miscBonus: s.miscBonus || 0 })) : INITIAL_DATA.skills,
          spellcastingAbility: json.spellcastingAbility || INITIAL_DATA.spellcastingAbility
        });
      } catch (err) {
        alert('Erro ao importar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const updateField = (field: keyof CharacterData, value: any) => {
    setChar(prev => ({ ...prev, [field]: value }));
  };

  const updateAbility = (ability: Ability, score: number) => {
    setChar(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: score }
    }));
  };

  const toggleSkillProficiency = (index: number) => {
    const newSkills = [...char.skills];
    newSkills[index].proficient = !newSkills[index].proficient;
    updateField('skills', newSkills);
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const newSkills = [...char.skills];
    (newSkills[index] as any)[field] = value;
    updateField('skills', newSkills);
  };

  const addAttack = () => {
    const newAttack: Attack = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Ataque',
      bonus: '+0',
      damage: '1d6'
    };
    updateField('attacks', [...char.attacks, newAttack]);
  };

  const removeAttack = (id: string) => {
    updateField('attacks', char.attacks.filter(a => a.id !== id));
  };

  const updateAttack = (id: string, field: keyof Attack, value: string) => {
    updateField('attacks', char.attacks.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addInventoryItem = () => {
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Item',
      quantity: 1,
      weight: '0',
      description: ''
    };
    updateField('inventory', [...char.inventory, newItem]);
  };

  const removeInventoryItem = (id: string) => {
    updateField('inventory', char.inventory.filter(i => i.id !== id));
  };

  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: any) => {
    updateField('inventory', char.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addSpell = () => {
    const newSpell: Spell = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nova Magia',
      level: 0,
      school: 'Abjuração',
      castingTime: '1 ação',
      range: 'Pessoal',
      components: 'V, S',
      description: '',
      prepared: false
    };
    updateField('spells', [...char.spells, newSpell]);
  };

  const removeSpell = (id: string) => {
    updateField('spells', char.spells.filter(s => s.id !== id));
  };

  const updateSpell = (id: string, field: keyof Spell, value: any) => {
    updateField('spells', char.spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateSpellSlot = (level: number, field: 'total' | 'used', value: number) => {
    setChar(prev => ({
      ...prev,
      spellSlots: {
        ...prev.spellSlots,
        [level]: { ...prev.spellSlots[level], [field]: value }
      }
    }));
  };

  const resetCharacter = () => {
    if (confirm('Tem certeza que deseja limpar toda a ficha?')) {
      setChar(INITIAL_DATA);
    }
  };

  const toggleSavingThrow = (ability: Ability) => {
    const newProficiencies = char.proficiencies.includes(ability)
      ? char.proficiencies.filter(a => a !== ability)
      : [...char.proficiencies, ability];
    updateField('proficiencies', newProficiencies);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#181818] border-b border-white/10 px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
            <Sword className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">D&D 5e Sheet</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={resetCharacter}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 rounded-md transition-colors text-sm font-medium text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Limpar</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-sm font-medium border border-white/5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exportar</span>
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-sm font-medium border border-white/5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Importar</span>
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button 
            onClick={() => localStorage.setItem('dnd_character_sheet', JSON.stringify(char))}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-md transition-colors text-sm font-bold shadow-lg shadow-red-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Character Header Info */}
        <section className="bg-[#181818] rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value={char.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nome do Personagem"
                  className="w-full bg-transparent text-3xl font-black border-b-2 border-transparent focus:border-red-600 outline-none transition-all placeholder:text-white/20"
                />
                <div className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">Nome do Personagem</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[80px]">
                  <input
                    type="number"
                    value={profBonus}
                    onChange={(e) => setProfBonus(parseInt(e.target.value) || 0)}
                    className="text-2xl font-bold text-red-500 bg-transparent w-10 text-center outline-none"
                  />
                  <span className="text-[10px] uppercase font-black text-white/40">Proficiência</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={char.classLevel}
                    onChange={(e) => updateField('classLevel', e.target.value)}
                    placeholder="Classe e Nível"
                    className="w-full bg-transparent text-lg font-bold border-b border-white/10 focus:border-red-600 outline-none transition-all"
                  />
                  <div className="text-[10px] uppercase font-black text-white/40 mt-1">Classe e Nível</div>
                </div>
                <div 
                  onClick={() => updateField('inspiration', !char.inspiration)}
                  className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center min-w-[80px] ${char.inspiration ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/5'}`}
                >
                  <Zap className={`w-5 h-5 mb-1 ${char.inspiration ? 'text-yellow-500 fill-yellow-500' : 'text-white/20'}`} />
                  <span className="text-[10px] uppercase font-black text-white/40">Inspiração</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Raça', field: 'race' },
                { label: 'Antecedente', field: 'background' },
                { label: 'Tendência', field: 'alignment' },
                { label: 'Experiência', field: 'xp' }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <input
                    type="text"
                    value={(char as any)[item.field]}
                    onChange={(e) => updateField(item.field as any, e.target.value)}
                    placeholder="---"
                    className="w-full bg-white/5 px-3 py-2 rounded-lg border border-white/5 focus:border-red-600 outline-none transition-all font-medium"
                  />
                  <div className="text-[10px] uppercase font-black text-white/40 px-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-3 space-y-8">
            {/* Abilities */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {(Object.keys(char.abilities) as Ability[]).map((ability) => {
                const score = char.abilities[ability];
                const mod = getMod(score);
                return (
                  <motion.div 
                    key={ability}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex flex-col items-center relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5 group-hover:bg-red-600 transition-colors" />
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{ABILITY_LABELS[ability]}</span>
                    <span className="text-4xl font-black text-white mb-1">{formatMod(mod)}</span>
                    <div className="bg-white/5 w-full rounded-lg py-1 flex items-center justify-center border border-white/5">
                      <input
                        type="number"
                        value={score}
                        onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 0)}
                        className="bg-transparent w-10 text-center font-bold outline-none"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Saving Throws */}
            <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Testes de Resistência</span>
              </div>
              <div className="p-2 space-y-1">
                {(Object.keys(char.abilities) as Ability[]).map((ability) => {
                  const isProficient = char.proficiencies.includes(ability);
                  const mod = getMod(char.abilities[ability]) + (isProficient ? profBonus : 0);
                  return (
                    <div 
                      key={ability}
                      onClick={() => toggleSavingThrow(ability)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${isProficient ? 'bg-red-600 border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'border-white/20 group-hover:border-white/40'}`} />
                      <span className="text-sm font-bold text-white/40 w-8">{formatMod(mod)}</span>
                      <span className="text-sm font-medium flex-1">{ABILITY_LABELS[ability]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passive Perception */}
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex items-center justify-between group hover:border-red-600/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Percepção Passiva</span>
                <span className="text-xs font-medium text-white/20">(Sabedoria)</span>
              </div>
              <div className="text-2xl font-black text-red-500">
                {10 + getMod(char.abilities.SAB) + (char.skills.find(s => s.name === 'Percepção')?.proficient ? profBonus : 0)}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
                <span className="text-xs font-black uppercase tracking-widest text-white/60">Perícias</span>
                <Info className="w-4 h-4 text-white/20" />
              </div>
              <div className="p-2 space-y-1">
                {char.skills.map((skill, idx) => {
                  const abilityMod = getMod(char.abilities[skill.ability]);
                  const profMod = skill.proficient ? profBonus : 0;
                  const miscMod = skill.miscBonus || 0;
                  const totalMod = abilityMod + profMod + miscMod;
                  
                  return (
                    <div 
                      key={skill.name}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div 
                        onClick={() => toggleSkillProficiency(idx)}
                        className={`w-3 h-3 rounded-full border-2 transition-all cursor-pointer ${skill.proficient ? 'bg-red-600 border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'border-white/20 group-hover:border-white/40'}`} 
                      />
                      <div className="text-sm font-black text-red-500 w-8 text-center">{formatMod(totalMod)}</div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-xs font-medium">{skill.name}</span>
                        <span className="text-[8px] font-black text-white/20 uppercase">{skill.ability.substring(0, 3)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                          <div className="text-[6px] uppercase font-black text-white/20">Misc</div>
                          <input
                            type="number"
                            value={skill.miscBonus}
                            onChange={(e) => updateSkill(idx, 'miscBonus', parseInt(e.target.value) || 0)}
                            className="bg-white/5 w-6 text-[10px] text-center rounded border border-white/5 outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column: Combat & Actions */}
          <div className="lg:col-span-6 space-y-8">
            {/* Combat Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative group">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Shield className="w-6 h-6 text-red-500 mb-2" />
                <input
                  type="number"
                  value={char.ac}
                  onChange={(e) => updateField('ac', parseInt(e.target.value) || 0)}
                  className="bg-transparent text-3xl font-black text-center w-full outline-none"
                />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Classe Armadura</span>
              </div>
              <div className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative group">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <Zap className="w-6 h-6 text-yellow-500 mb-2" />
                <input
                  type="number"
                  value={char.initiative}
                  onChange={(e) => updateField('initiative', parseInt(e.target.value) || 0)}
                  className="bg-transparent text-3xl font-black text-center w-full outline-none"
                />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Iniciativa</span>
              </div>
              <div className="bg-[#181818] rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative group">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <ChevronRight className="w-6 h-6 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={char.speed}
                  onChange={(e) => updateField('speed', e.target.value)}
                  className="bg-transparent text-3xl font-black text-center w-full outline-none"
                />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Deslocamento</span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
                  <span className="text-sm font-black uppercase tracking-widest text-white/60">Pontos de Vida</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="number"
                    value={char.hpCurrent}
                    onChange={(e) => updateField('hpCurrent', parseInt(e.target.value) || 0)}
                    className="bg-white/5 w-16 text-center py-1 rounded border border-white/10 outline-none focus:border-red-500"
                  />
                  <span className="text-white/20">/</span>
                  <input
                    type="number"
                    value={char.hpMax}
                    onChange={(e) => updateField('hpMax', parseInt(e.target.value) || 0)}
                    className="bg-white/5 w-16 text-center py-1 rounded border border-white/10 outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (char.hpCurrent / char.hpMax) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-white/40 px-1">Vida Temporária</div>
                  <input
                    type="number"
                    value={char.hpTemp}
                    onChange={(e) => updateField('hpTemp', parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-white/40 px-1">Dados de Vida</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={char.hitDiceRemaining}
                      onChange={(e) => updateField('hitDiceRemaining', e.target.value)}
                      className="w-1/2 bg-white/5 px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-red-500 text-center"
                    />
                    <input
                      type="text"
                      value={char.hitDiceTotal}
                      onChange={(e) => updateField('hitDiceTotal', e.target.value)}
                      className="w-1/2 bg-white/5 px-3 py-2 rounded-lg border border-white/5 outline-none focus:border-red-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Death Saves */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Testes contra a Morte</span>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase text-white/20">Sucessos</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={`success-${i}`}
                          onClick={() => setChar(prev => ({
                            ...prev,
                            deathSaves: { ...prev.deathSaves, successes: prev.deathSaves.successes === i ? i - 1 : i }
                          }))}
                          className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${char.deathSaves.successes >= i ? 'bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'border-white/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase text-white/20">Falhas</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div 
                          key={`failure-${i}`}
                          onClick={() => setChar(prev => ({
                            ...prev,
                            deathSaves: { ...prev.deathSaves, failures: prev.deathSaves.failures === i ? i - 1 : i }
                          }))}
                          className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${char.deathSaves.failures >= i ? 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-white/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Tabs */}
            <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="flex border-b border-white/5">
                {[
                  { id: 'combat', label: 'Combate', icon: Sword },
                  { id: 'spells', label: 'Magias', icon: ScrollText },
                  { id: 'equipment', label: 'Equipamento', icon: Backpack },
                  { id: 'features', label: 'Características', icon: Trophy }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-red-500' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-1 bg-red-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'combat' && (
                    <motion.div 
                      key="combat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Ataques e Conjurações</h3>
                        <button 
                          onClick={addAttack}
                          className="p-1.5 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {char.attacks.map((attack) => (
                          <div key={attack.id} className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-12 gap-4 items-center group">
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={attack.name}
                                onChange={(e) => updateAttack(attack.id, 'name', e.target.value)}
                                className="bg-transparent w-full font-bold outline-none focus:text-red-500"
                              />
                              <div className="text-[10px] uppercase font-black text-white/20">Nome</div>
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={attack.bonus}
                                onChange={(e) => updateAttack(attack.id, 'bonus', e.target.value)}
                                className="bg-transparent w-full font-bold text-center outline-none"
                              />
                              <div className="text-[10px] uppercase font-black text-white/20 text-center">Bônus</div>
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={attack.damage}
                                onChange={(e) => updateAttack(attack.id, 'damage', e.target.value)}
                                className="bg-transparent w-full font-bold text-center outline-none"
                              />
                              <div className="text-[10px] uppercase font-black text-white/20 text-center">Dano</div>
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button 
                                onClick={() => removeAttack(attack.id)}
                                className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {char.attacks.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-white/20 italic">
                            Nenhum ataque adicionado
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'equipment' && (
                    <motion.div 
                      key="equipment"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Inventário</h3>
                        <button 
                          onClick={addInventoryItem}
                          className="p-1.5 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {char.inventory.map((item) => (
                          <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 group">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-6">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)}
                                  className="bg-transparent w-full font-bold outline-none focus:text-red-500"
                                />
                                <div className="text-[10px] uppercase font-black text-white/20">Nome do Item</div>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  className="bg-transparent w-full font-bold text-center outline-none"
                                />
                                <div className="text-[10px] uppercase font-black text-white/20 text-center">Qtd</div>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={item.weight}
                                  onChange={(e) => updateInventoryItem(item.id, 'weight', e.target.value)}
                                  className="bg-transparent w-full font-bold text-center outline-none"
                                />
                                <div className="text-[10px] uppercase font-black text-white/20 text-center">Peso</div>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button 
                                  onClick={() => removeInventoryItem(item.id)}
                                  className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)}
                              placeholder="Descrição do item..."
                              className="w-full bg-black/20 p-2 rounded-lg text-xs outline-none focus:border-red-600/50 border border-transparent resize-none h-16"
                            />
                          </div>
                        ))}
                        {char.inventory.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-white/20 italic">
                            Inventário vazio
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <div className="text-[10px] font-black uppercase text-white/40 mb-2 px-1">Notas Adicionais de Equipamento</div>
                        <textarea
                          value={char.equipment}
                          onChange={(e) => updateField('equipment', e.target.value)}
                          placeholder="Moedas, tesouros, notas..."
                          className="w-full h-32 bg-white/5 p-4 rounded-xl border border-white/5 outline-none focus:border-red-600 resize-none font-medium text-sm"
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'features' && (
                    <motion.div 
                      key="features"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <textarea
                        value={char.features}
                        onChange={(e) => updateField('features', e.target.value)}
                        placeholder="Habilidades de classe, talentos e outras características..."
                        className="w-full h-80 bg-white/5 p-4 rounded-xl border border-white/5 outline-none focus:border-red-600 resize-none font-medium leading-relaxed"
                      />
                    </motion.div>
                  )}

                  {activeTab === 'spells' && (
                    <motion.div 
                      key="spells"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Spellcasting Header */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-[10px] uppercase font-black text-white/40">Habilidade Chave</div>
                          <select 
                            value={char.spellcastingAbility}
                            onChange={(e) => updateField('spellcastingAbility', e.target.value as Ability)}
                            className="bg-transparent font-bold outline-none text-red-500"
                          >
                            {Object.keys(ABILITY_LABELS).map(a => (
                              <option key={a} value={a} className="bg-[#181818]">{a}</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-center border-x border-white/10">
                          <div className="text-[10px] uppercase font-black text-white/40">CD de Resistência</div>
                          <div className="text-xl font-black">{8 + profBonus + getMod(char.abilities[char.spellcastingAbility])}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] uppercase font-black text-white/40">Bônus de Ataque</div>
                          <div className="text-xl font-black">{formatMod(profBonus + getMod(char.abilities[char.spellcastingAbility]))}</div>
                        </div>
                      </div>

                      {/* Spell Slots */}
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                          <div key={lvl} className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                            <div className="text-[8px] uppercase font-black text-white/40 mb-1">Nível {lvl}</div>
                            <div className="flex flex-col gap-1">
                              <input
                                type="number"
                                value={char.spellSlots[lvl].used}
                                onChange={(e) => updateSpellSlot(lvl, 'used', parseInt(e.target.value) || 0)}
                                className="bg-red-600/20 text-red-500 text-xs font-bold w-full text-center rounded outline-none"
                                placeholder="U"
                              />
                              <div className="h-[1px] bg-white/10" />
                              <input
                                type="number"
                                value={char.spellSlots[lvl].total}
                                onChange={(e) => updateSpellSlot(lvl, 'total', parseInt(e.target.value) || 0)}
                                className="bg-white/10 text-white text-xs font-bold w-full text-center rounded outline-none"
                                placeholder="T"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Spell List */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Magias Conhecidas</h3>
                          <button 
                            onClick={addSpell}
                            className="p-1.5 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {char.spells.map((spell) => (
                            <div key={spell.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden group">
                              <div className="p-4 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1 flex justify-center">
                                  <div 
                                    onClick={() => updateSpell(spell.id, 'prepared', !spell.prepared)}
                                    className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${spell.prepared ? 'bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-white/20'}`}
                                  />
                                </div>
                                <div className="col-span-5">
                                  <input
                                    type="text"
                                    value={spell.name}
                                    onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                                    className="bg-transparent w-full font-bold outline-none focus:text-red-500"
                                  />
                                  <div className="text-[10px] uppercase font-black text-white/20">Nome da Magia</div>
                                </div>
                                <div className="col-span-2">
                                  <input
                                    type="number"
                                    value={spell.level}
                                    onChange={(e) => updateSpell(spell.id, 'level', parseInt(e.target.value) || 0)}
                                    className="bg-transparent w-full font-bold text-center outline-none"
                                  />
                                  <div className="text-[10px] uppercase font-black text-white/20 text-center">Nível</div>
                                </div>
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    value={spell.school}
                                    onChange={(e) => updateSpell(spell.id, 'school', e.target.value)}
                                    className="bg-transparent w-full font-bold text-center outline-none"
                                  />
                                  <div className="text-[10px] uppercase font-black text-white/20 text-center">Escola</div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button 
                                    onClick={() => removeSpell(spell.id)}
                                    className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="px-4 pb-4 grid grid-cols-3 gap-4">
                                <div>
                                  <div className="text-[8px] uppercase font-black text-white/20">Tempo</div>
                                  <input
                                    type="text"
                                    value={spell.castingTime}
                                    onChange={(e) => updateSpell(spell.id, 'castingTime', e.target.value)}
                                    className="bg-black/20 w-full text-[10px] p-1 rounded outline-none"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] uppercase font-black text-white/20">Alcance</div>
                                  <input
                                    type="text"
                                    value={spell.range}
                                    onChange={(e) => updateSpell(spell.id, 'range', e.target.value)}
                                    className="bg-black/20 w-full text-[10px] p-1 rounded outline-none"
                                  />
                                </div>
                                <div>
                                  <div className="text-[8px] uppercase font-black text-white/20">Componentes</div>
                                  <input
                                    type="text"
                                    value={spell.components}
                                    onChange={(e) => updateSpell(spell.id, 'components', e.target.value)}
                                    className="bg-black/20 w-full text-[10px] p-1 rounded outline-none"
                                  />
                                </div>
                              </div>
                              <div className="px-4 pb-4">
                                <textarea
                                  value={spell.description}
                                  onChange={(e) => updateSpell(spell.id, 'description', e.target.value)}
                                  placeholder="Descrição da magia..."
                                  className="w-full bg-black/20 p-2 rounded-lg text-xs outline-none focus:border-red-600/50 border border-transparent resize-none h-20"
                                />
                              </div>
                            </div>
                          ))}
                          {char.spells.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-white/20 italic">
                              Nenhuma magia adicionada
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Personality & Background */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-[#181818] rounded-2xl border border-white/5 p-6 space-y-6 shadow-xl">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" />
                <span className="text-sm font-black uppercase tracking-widest text-white/60">Personalidade</span>
              </div>
              
              {[
                { label: 'Traços de Personalidade', field: 'traits' },
                { label: 'Ideais', field: 'ideals' },
                { label: 'Ligações', field: 'bonds' },
                { label: 'Defeitos', field: 'flaws' }
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="text-[10px] font-black uppercase text-white/40 px-1">{item.label}</div>
                  <textarea
                    value={(char.personality as any)[item.field]}
                    onChange={(e) => setChar(prev => ({
                      ...prev,
                      personality: { ...prev.personality, [item.field]: e.target.value }
                    }))}
                    className="w-full bg-white/5 p-3 rounded-xl border border-white/5 outline-none focus:border-red-600 resize-none text-sm min-h-[80px]"
                  />
                </div>
              ))}
            </div>

            <div className="bg-[#181818] rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-white/40" />
                <span className="text-sm font-black uppercase tracking-widest text-white/60">Idiomas e Outros</span>
              </div>
              <textarea
                value={char.languages}
                onChange={(e) => updateField('languages', e.target.value)}
                placeholder="Idiomas, proficiências em ferramentas, etc..."
                className="w-full h-40 bg-white/5 p-3 rounded-xl border border-white/5 outline-none focus:border-red-600 resize-none text-sm"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-8 border-t border-white/5 text-center text-white/20 text-xs font-medium">
        <p>Inspirado no D&D Beyond • Criado para RPGistas</p>
      </footer>
    </div>
  );
}
