import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Shield, Sword, Heart, Zap, Save, Download, Upload, Plus, Trash2, 
  ChevronRight, Info, Settings, User, ScrollText, Backpack, Trophy, BookOpen,
  Image as ImageIcon, Dices, X, Moon, Sun, Search, Filter, RefreshCw, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toJpeg } from 'html-to-image';
import { CharacterData, INITIAL_DATA, Ability, Skill, Attack, InventoryItem, Spell } from './types';

const ABILITY_LABELS: Record<Ability, string> = {
  FOR: 'Força', DES: 'Destreza', CON: 'Constituição',
  INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma'
};

const getMod = (score: number) => Math.floor((score - 10) / 2);
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod.toString());

const rollDice = (formula: string) => {
  const regex = /^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i;
  const match = formula.trim().replace(/\s+/g, '').match(regex);
  if (!match) return null;

  const count = parseInt(match[1]) || 1;
  const sides = parseInt(match[2]);
  const op = match[3];
  const mod = match[4] ? parseInt(match[4]) : 0;

  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = op === '-' ? sum - mod : sum + mod;

  return { formula, rolls, sum, op, mod, total };
};

const generateCharacter = () => {
  const roll4d6DropLowest = () => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((a, b) => a + b, 0);
  };

  const races = ['Humano', 'Elfo', 'Anão', 'Halfling', 'Draconato', 'Tiefling', 'Gnomo', 'Meio-Elfo', 'Meio-Orc'];
  const classes = ['Guerreiro', 'Mago', 'Clérigo', 'Ladino', 'Paladino', 'Bardo', 'Ranger', 'Feiticeiro', 'Bruxo', 'Monge', 'Bárbaro', 'Druida'];
  const alignments = ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'];
  const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Bilbo', 'Boromir', 'Eowyn', 'Galadriel', 'Elrond', 'Thranduil', 'Thorin'];

  const abilities: Record<Ability, number> = {
    FOR: roll4d6DropLowest(),
    DES: roll4d6DropLowest(),
    CON: roll4d6DropLowest(),
    INT: roll4d6DropLowest(),
    SAB: roll4d6DropLowest(),
    CAR: roll4d6DropLowest()
  };

  return {
    ...INITIAL_DATA,
    name: names[Math.floor(Math.random() * names.length)],
    race: races[Math.floor(Math.random() * races.length)],
    classLevel: `${classes[Math.floor(Math.random() * classes.length)]} 1`,
    alignment: alignments[Math.floor(Math.random() * alignments.length)],
    abilities
  };
};

const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => (
  <div className="ff-tooltip inline-flex items-center">
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

export default function App() {
  const [char, setChar] = useState<CharacterData>(() => {
    const saved = localStorage.getItem('dnd_character_sheet');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DATA,
          ...parsed,
          coins: parsed.coins || INITIAL_DATA.coins,
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
  const [activeTab, setActiveTab] = useState<'combat' | 'spells' | 'equipment' | 'features' | 'details'>('combat');
  const [rollResult, setRollResult] = useState<{
    label: string, 
    results: {formula: string, total: number, rolls: number[], mod: number, op?: string}[]
  } | null>(null);
  const [rollHistory, setRollHistory] = useState<{id: string, label: string, total: number, timestamp: number}[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dnd_dark_mode') === 'true');
  const [spellSearch, setSpellSearch] = useState('');
  const [spellFilter, setSpellFilter] = useState<{level: number | 'all', prepared: boolean | 'all', school: string | 'all'}>({
    level: 'all',
    prepared: 'all',
    school: 'all'
  });
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('dnd_character_sheet', JSON.stringify(char));
  }, [char]);

  useEffect(() => {
    localStorage.setItem('dnd_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleRoll = useCallback((formula: string | string[], label: string) => {
    const formulas = Array.isArray(formula) ? formula : [formula];
    const results = formulas.map(f => {
      const res = rollDice(f);
      return res ? { ...res } : null;
    }).filter((r): r is any => r !== null);
    
    if (results.length > 0) {
      setRollResult({ label, results });
      
      results.forEach(res => {
        setRollHistory(prev => [{
          id: crypto.randomUUID(),
          label: results.length > 1 ? `${label} (${res.formula})` : label,
          total: res.total,
          timestamp: Date.now()
        }, ...prev].slice(0, 10));
      });
    }
  }, []);

  const totalWeight = useMemo(() => {
    return char.inventory.reduce((sum, item) => sum + (parseFloat(item.weight) || 0) * item.quantity, 0);
  }, [char.inventory]);

  const weightLimit = char.abilities.FOR * 15;
  const isOverweight = totalWeight > weightLimit;

  const filteredSpells = useMemo(() => {
    return char.spells.filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(spellSearch.toLowerCase());
      const matchesLevel = spellFilter.level === 'all' || spell.level === spellFilter.level;
      const matchesPrepared = spellFilter.prepared === 'all' || spell.prepared === spellFilter.prepared;
      const matchesSchool = spellFilter.school === 'all' || spell.school === spellFilter.school;
      return matchesSearch && matchesLevel && matchesPrepared && matchesSchool;
    });
  }, [char.spells, spellSearch, spellFilter]);

  const toggleSkillState = (index: number) => {
    const newSkills = [...char.skills];
    const skill = newSkills[index];
    
    if (!skill.proficient && !skill.expertise) {
      skill.proficient = true;
      skill.expertise = false;
    } else if (skill.proficient && !skill.expertise) {
      skill.proficient = true;
      skill.expertise = true;
    } else {
      skill.proficient = false;
      skill.expertise = false;
    }
    
    updateField('skills', newSkills);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${char.name || 'personagem'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportJpg = async () => {
    setIsExporting(true);
    // Wait for the hidden full-sheet to render
    setTimeout(async () => {
      if (exportRef.current === null) {
        setIsExporting(false);
        return;
      }
      
      try {
        const dataUrl = await toJpeg(exportRef.current, { 
          quality: 0.95, 
          backgroundColor: '#e8e0c8',
          style: { borderRadius: '0' }
        });
        
        const link = document.createElement('a');
        link.download = `${char.name || 'personagem'}.jpg`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Erro ao gerar JPG:', err);
        alert('Erro ao gerar imagem JPG.');
      } finally {
        setIsExporting(false);
      }
    }, 500);
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
          coins: json.coins || INITIAL_DATA.coins,
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
    setChar(prev => ({ ...prev, abilities: { ...prev.abilities, [ability]: score } }));
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
    const newAttack: Attack = { id: crypto.randomUUID(), name: 'Novo Ataque', bonus: 0, damage: '1d6' };
    updateField('attacks', [...char.attacks, newAttack]);
  };

  const removeAttack = (id: string) => updateField('attacks', char.attacks.filter(a => a.id !== id));
  const updateAttack = (id: string, field: keyof Attack, value: any) => updateField('attacks', char.attacks.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addInventoryItem = () => {
    const newItem: InventoryItem = { id: crypto.randomUUID(), name: 'Novo Item', quantity: 1, weight: '0', description: '' };
    updateField('inventory', [...char.inventory, newItem]);
  };

  const removeInventoryItem = (id: string) => updateField('inventory', char.inventory.filter(i => i.id !== id));
  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: any) => updateField('inventory', char.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));

  const addSpell = () => {
    const newSpell: Spell = { id: crypto.randomUUID(), name: 'Nova Magia', level: 0, school: 'Abjuração', castingTime: '1 ação', range: 'Pessoal', components: 'V, S', description: '', prepared: false };
    updateField('spells', [...char.spells, newSpell]);
  };

  const removeSpell = (id: string) => updateField('spells', char.spells.filter(s => s.id !== id));
  const updateSpell = (id: string, field: keyof Spell, value: any) => updateField('spells', char.spells.map(s => s.id === id ? { ...s, [field]: value } : s));

  const updateSpellSlot = (level: number, field: 'total' | 'used', value: number) => {
    setChar(prev => ({ ...prev, spellSlots: { ...prev.spellSlots, [level]: { ...prev.spellSlots[level], [field]: value } } }));
  };

  const updateCoin = (coin: keyof CharacterData['coins'], value: number) => {
    setChar(prev => ({ ...prev, coins: { ...prev.coins, [coin]: value } }));
  };

  const resetCharacter = () => {
    if (confirm('Tem certeza que deseja limpar toda a ficha?')) {
      setChar(INITIAL_DATA);
      setProfBonus(2);
      setActiveTab('combat');
      setRollHistory([]);
    }
  };

  const toggleSavingThrow = (ability: Ability) => {
    const newProficiencies = char.proficiencies.includes(ability) ? char.proficiencies.filter(a => a !== ability) : [...char.proficiencies, ability];
    updateField('proficiencies', newProficiencies);
  };

  const handleBonusChange = (id: string, value: string) => {
    const valid = value.replace(/[^0-9+\-]/g, '');
    updateAttack(id, 'bonus', valid);
  };

  const handleDamageChange = (id: string, value: string) => {
    const valid = value.replace(/[^0-9dD+\-\s]/g, '');
    updateAttack(id, 'damage', valid);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateField('portrait', base64);
    };
    reader.readAsDataURL(file);
  };

  const hpPercent = char.hpMax > 0 ? Math.min(100, (char.hpCurrent / char.hpMax) * 100) : 0;

  return (
    <div className="min-h-screen text-ink font-sans selection:bg-gold/30 pb-12">
      {/* Roll Result Popup */}
      <AnimatePresence>
        {rollResult && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-20 lg:bottom-8 left-1/2 z-[100] bg-ink text-parchment px-6 py-4 rounded-sm border-2 border-gold shadow-2xl flex flex-col items-center gap-4 min-w-[280px]"
          >
            <button onClick={() => setRollResult(null)} className="absolute top-1 right-1 text-gold/50 hover:text-gold">
              <X className="w-4 h-4" />
            </button>
            <div className="text-[10px] uppercase font-bold tracking-widest text-gold/70 border-b border-gold/30 w-full text-center pb-1">{rollResult.label}</div>
            
            <div className="flex flex-col gap-4 w-full">
              {rollResult.results.map((res, idx) => (
                <div key={idx} className="flex items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <div className="text-[8px] uppercase text-gold/50">
                      {res.formula.includes('d20') ? 'Ataque' : 'Dano'} ({res.formula})
                    </div>
                    <div className="text-[10px] font-bold">({res.rolls.join(' + ')}) {res.op}{res.mod}</div>
                  </div>
                  <div className="text-3xl font-bold ff-title text-gold">{res.total}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exporting Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-parchment/80 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-gold border-t-accent-red rounded-full animate-spin mb-4" />
            <div className="ff-title text-xl font-bold text-ink">Gerando Ficha Completa...</div>
            <div className="text-sm text-ink-light mt-2">Isso pode levar alguns segundos</div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="sticky top-0 z-50 bg-parchment-light/90 backdrop-blur-md border-b border-gold shadow-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-ink rounded-sm flex items-center justify-center border border-gold shadow-sm">
            <Sword className="text-gold-light w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block ff-title text-ink">D&D 5e Sheet</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gold/10 rounded-sm transition-colors text-ink border border-gold/30">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={resetCharacter} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent-red/10 rounded-sm transition-colors text-sm font-medium text-accent-red border border-transparent hover:border-accent-red/30">
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline ff-title">Limpar</span>
          </button>
          <button onClick={handleExportJpg} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gold/10 rounded-sm transition-colors text-sm font-medium border border-gold/50 text-ink">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden md:inline ff-title">Exportar</span>
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-gold/10 rounded-sm transition-colors text-sm font-medium border border-gold/50 text-ink cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline ff-title">Carregar</span>
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button onClick={handleExportJson} className="flex items-center gap-2 px-4 py-1.5 bg-ink hover:bg-ink-light rounded-sm transition-colors text-sm font-bold text-parchment border border-gold shadow-md">
            <Save className="w-4 h-4" />
            <span className="ff-title">Salvar</span>
          </button>
        </div>
      </header>

      <main ref={sheetRef} className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-parchment-light dark:bg-parchment transition-colors">
        {/* Roll History Side Panel (Desktop) */}
        <div className="fixed right-4 top-24 z-40 hidden xl:block w-64">
          <div className="ff-panel p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gold/30 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold uppercase tracking-widest ff-title">Histórico</span>
              </div>
              {rollHistory.length > 0 && (
                <button 
                  onClick={() => setRollHistory([])} 
                  className="p-1 text-ink/30 hover:text-accent-red transition-colors"
                  title="Limpar Histórico"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {rollHistory.map(roll => (
                <div key={roll.id} className="text-xs p-2 bg-ink/5 rounded-sm border border-gold/10 flex justify-between items-center">
                  <span className="font-medium truncate mr-2">{roll.label}</span>
                  <span className="font-bold text-accent-red ff-title">{roll.total}</span>
                </div>
              ))}
              {rollHistory.length === 0 && <div className="text-center text-[10px] text-ink/30 italic py-4">Nenhuma rolagem</div>}
            </div>
          </div>
        </div>
        {/* Character Header Info */}
        <section className="ff-panel p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <div className="relative group">
                <input type="text" value={char.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Nome do Personagem" className="w-full bg-transparent text-4xl font-bold border-b-2 border-gold/30 focus:border-accent-red outline-none transition-all placeholder:text-ink/30 ff-title" />
                <div className="text-[10px] text-ink-light uppercase font-bold tracking-widest mt-1">Nome do Personagem</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-parchment px-4 py-2 rounded-sm border border-gold/50 flex flex-col items-center min-w-[80px] shadow-inner">
                  <input type="number" value={profBonus} onChange={(e) => setProfBonus(parseInt(e.target.value) || 0)} className="text-2xl font-bold text-accent-red bg-transparent w-10 text-center outline-none ff-title" />
                  <span className="text-[10px] uppercase font-bold text-ink-light">Proficiência</span>
                </div>
                <div className="flex-1">
                  <input type="text" value={char.classLevel} onChange={(e) => updateField('classLevel', e.target.value)} placeholder="Classe e Nível" className="ff-input w-full text-lg" />
                  <div className="text-[10px] uppercase font-bold text-ink-light mt-1">Classe e Nível</div>
                </div>
                <div onClick={() => updateField('inspiration', !char.inspiration)} className={`px-4 py-2 rounded-sm border transition-all cursor-pointer flex flex-col items-center min-w-[80px] ${char.inspiration ? 'bg-gold/20 border-gold shadow-[0_0_15px_rgba(166,138,86,0.4)]' : 'bg-parchment border-gold/50'}`}>
                  <Zap className={`w-5 h-5 mb-1 ${char.inspiration ? 'text-gold fill-gold' : 'text-ink/30'}`} />
                  <span className="text-[10px] uppercase font-bold text-ink-light">Inspiração</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Nome do Jogador', field: 'playerName' },
                { label: 'Raça', field: 'race' },
                { label: 'Antecedente', field: 'background' },
                { label: 'Tendência', field: 'alignment' },
                { label: 'Experiência', field: 'xp' }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <input type="text" value={(char as any)[item.field]} onChange={(e) => updateField(item.field as any, e.target.value)} placeholder="---" className="ff-input w-full px-1 py-1" />
                  <div className="text-[10px] uppercase font-bold text-ink-light px-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Abilities & Skills */}
          <div className="lg:col-span-3 space-y-6">
            {/* Abilities */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {(Object.keys(char.abilities) as Ability[]).map((ability) => {
                const score = char.abilities[ability];
                const mod = getMod(score);
                return (
                  <motion.div key={ability} whileHover={{ scale: 1.02 }} className="ff-panel p-4 flex flex-col items-center relative overflow-hidden group">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-ink-light uppercase tracking-widest">{ABILITY_LABELS[ability]}</span>
                      <button 
                        onClick={() => handleRoll(`1d20${formatMod(mod)}`, ABILITY_LABELS[ability])}
                        className="p-1 hover:bg-gold/20 rounded-full transition-colors text-gold"
                      >
                        <Dices className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-4xl font-bold text-ink mb-1 ff-title">{formatMod(mod)}</span>
                    <div className="bg-parchment w-full rounded-sm py-1 flex items-center justify-center border border-gold/50 shadow-inner">
                      <input type="number" value={score} onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 0)} className="bg-transparent w-10 text-center font-bold outline-none text-ink" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Saving Throws */}
            <div className="ff-panel overflow-hidden">
              <div className="bg-ink/5 px-4 py-3 flex items-center justify-between border-b border-gold/30">
                <span className="text-xs font-bold uppercase tracking-widest text-ink ff-title">Testes de Resistência</span>
                <Tooltip text="Testes para resistir a efeitos nocivos. Marque a bolinha para adicionar sua proficiência.">
                  <Info className="w-4 h-4 text-ink/30 cursor-help" />
                </Tooltip>
              </div>
              <div className="p-2 space-y-1">
                {(Object.keys(char.abilities) as Ability[]).map((ability) => {
                  const isProficient = char.proficiencies.includes(ability);
                  const mod = getMod(char.abilities[ability]) + (isProficient ? profBonus : 0);
                  return (
                    <div key={ability} className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-ink/5 transition-colors group">
                      <div onClick={() => toggleSavingThrow(ability)} className={`w-3 h-3 rounded-full border-2 transition-all cursor-pointer ${isProficient ? 'bg-accent-red border-accent-red shadow-[0_0_8px_rgba(139,37,0,0.5)]' : 'border-gold/50 group-hover:border-gold'}`} />
                      <button 
                        onClick={() => handleRoll(`1d20${formatMod(mod)}`, `Resistência: ${ABILITY_LABELS[ability]}`)}
                        className="text-sm font-bold text-ink w-8 hover:text-accent-red transition-colors"
                      >
                        {formatMod(mod)}
                      </button>
                      <span className="text-sm font-medium flex-1">{ABILITY_LABELS[ability]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passive Perception */}
            <div className="ff-panel p-4 flex items-center justify-between group hover:border-accent-red/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-ink-light tracking-widest">Percepção Passiva</span>
                <span className="text-xs font-medium text-ink/50">(Sabedoria)</span>
              </div>
              <div className="text-2xl font-bold text-accent-red ff-title">
                {10 + getMod(char.abilities.SAB) + (char.skills.find(s => s.name === 'Percepção')?.proficient ? profBonus : 0)}
              </div>
            </div>

            {/* Skills */}
            <div className="ff-panel overflow-hidden">
              <div className="bg-ink/5 px-4 py-3 flex items-center justify-between border-b border-gold/30">
                <span className="text-xs font-bold uppercase tracking-widest text-ink ff-title">Perícias</span>
                <Tooltip text="Perícias representam o treinamento do personagem em tarefas específicas.">
                  <Info className="w-4 h-4 text-ink/30 cursor-help" />
                </Tooltip>
              </div>
              <div className="p-2 space-y-1">
                {char.skills.map((skill, idx) => {
                  const abilityMod = getMod(char.abilities[skill.ability]);
                  const profMod = skill.expertise ? profBonus * 2 : (skill.proficient ? profBonus : 0);
                  const miscMod = skill.miscBonus || 0;
                  const totalMod = abilityMod + profMod + miscMod;
                  
                  return (
                    <div key={skill.name} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-ink/5 transition-colors group">
                      <div 
                        onClick={() => toggleSkillState(idx)} 
                        className={`w-3 h-3 rounded-full border-2 transition-all cursor-pointer relative flex items-center justify-center ${
                          skill.expertise 
                            ? 'bg-accent-red border-accent-red shadow-[0_0_8px_rgba(139,37,0,0.5)]' 
                            : skill.proficient 
                              ? 'bg-accent-red/50 border-accent-red' 
                              : 'border-gold/50 group-hover:border-gold'
                        }`}
                      >
                        {skill.expertise && <div className="w-1 h-1 bg-white rounded-full" />}
                      </div>
                      <button 
                        onClick={() => handleRoll(`1d20${formatMod(totalMod)}`, skill.name)}
                        className="text-sm font-bold text-accent-red w-8 text-center hover:scale-110 transition-transform"
                      >
                        {formatMod(totalMod)}
                      </button>
                      <div className="flex-1 flex flex-col">
                        <span className="text-xs font-medium">{skill.name}</span>
                        <span className="text-[8px] font-bold text-ink/40 uppercase">{skill.ability.substring(0, 3)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                          <div className="text-[6px] uppercase font-bold text-ink/40">Misc</div>
                          <input type="number" value={skill.miscBonus} onChange={(e) => updateSkill(idx, 'miscBonus', parseInt(e.target.value) || 0)} className="bg-parchment w-6 text-[10px] text-center rounded-sm border border-gold/30 outline-none focus:border-accent-red" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column: Combat & Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Combat Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="ff-panel p-4 flex flex-col items-center justify-center relative group">
                <Shield className="w-6 h-6 text-accent-red mb-2" />
                <input type="number" value={char.ac} onChange={(e) => updateField('ac', parseInt(e.target.value) || 0)} className="bg-transparent text-3xl font-bold text-center w-full outline-none ff-title" />
                <span className="text-[10px] font-bold uppercase text-ink-light tracking-widest">Classe Armadura</span>
              </div>
              <div className="ff-panel p-4 flex flex-col items-center justify-center relative group">
                <Zap className="w-6 h-6 text-gold mb-2" />
                <input type="number" value={char.initiative} onChange={(e) => updateField('initiative', parseInt(e.target.value) || 0)} className="bg-transparent text-3xl font-bold text-center w-full outline-none ff-title" />
                <span className="text-[10px] font-bold uppercase text-ink-light tracking-widest">Iniciativa</span>
              </div>
              <div className="ff-panel p-4 flex flex-col items-center justify-center relative group">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <ChevronRight className="w-6 h-6 text-ink-light" />
                </div>
                <input type="text" value={char.speed} onChange={(e) => updateField('speed', e.target.value)} className="bg-transparent text-3xl font-bold text-center w-full outline-none ff-title" />
                <span className="text-[10px] font-bold uppercase text-ink-light tracking-widest">Deslocamento</span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="ff-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent-red fill-accent-red/20" />
                  <span className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Pontos de Vida</span>
                  <Tooltip text="Seus pontos de vida atuais e máximos. Representam a vitalidade do personagem.">
                    <Info className="w-4 h-4 text-ink/30 cursor-help" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <input type="number" value={char.hpCurrent} onChange={(e) => updateField('hpCurrent', parseInt(e.target.value) || 0)} className="bg-parchment w-16 text-center py-1 rounded-sm border border-gold/50 outline-none focus:border-accent-red" />
                  <span className="text-ink/40">/</span>
                  <input type="number" value={char.hpMax} onChange={(e) => updateField('hpMax', parseInt(e.target.value) || 0)} className="bg-parchment w-16 text-center py-1 rounded-sm border border-gold/50 outline-none focus:border-accent-red" />
                </div>
              </div>
              <div className="h-4 bg-parchment rounded-sm overflow-hidden border border-gold/50 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${hpPercent}%` }} className="h-full bg-gradient-to-r from-accent-red to-[#b33900] shadow-[0_0_10px_rgba(139,37,0,0.4)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-ink-light px-1">Vida Temporária</div>
                  <input type="number" value={char.hpTemp} onChange={(e) => updateField('hpTemp', parseInt(e.target.value) || 0)} className="ff-input w-full px-2 py-1" />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-ink-light px-1">Dados de Vida</div>
                  <div className="flex gap-2">
                    <input type="text" value={char.hitDiceRemaining} onChange={(e) => updateField('hitDiceRemaining', e.target.value)} className="ff-input w-1/2 px-2 py-1 text-center" placeholder="Restante" />
                    <input type="text" value={char.hitDiceTotal} onChange={(e) => updateField('hitDiceTotal', e.target.value)} className="ff-input w-1/2 px-2 py-1 text-center" placeholder="Total" />
                  </div>
                </div>
              </div>

              {/* Death Saves */}
              <div className="pt-4 border-t border-gold/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-ink-light tracking-widest">Testes contra a Morte</span>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase text-ink/50">Sucessos</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={`success-${i}`} onClick={() => setChar(prev => ({ ...prev, deathSaves: { ...prev.deathSaves, successes: prev.deathSaves.successes === i ? i - 1 : i } }))} className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${char.deathSaves.successes >= i ? 'bg-ink border-ink shadow-[0_0_5px_rgba(44,30,22,0.5)]' : 'border-gold/50'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase text-ink/50">Falhas</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={`failure-${i}`} onClick={() => setChar(prev => ({ ...prev, deathSaves: { ...prev.deathSaves, failures: prev.deathSaves.failures === i ? i - 1 : i } }))} className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${char.deathSaves.failures >= i ? 'bg-accent-red border-accent-red shadow-[0_0_5px_rgba(139,37,0,0.5)]' : 'border-gold/50'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Tabs */}
            <div className="ff-panel overflow-hidden">
              <div className="flex border-b border-gold/30 bg-ink/5">
                {[
                  { id: 'combat', label: 'Combate', icon: Sword },
                  { id: 'spells', label: 'Magias', icon: ScrollText },
                  { id: 'equipment', label: 'Equipamento', icon: Backpack },
                  { id: 'details', label: 'Detalhes', icon: BookOpen },
                  { id: 'features', label: 'Traços', icon: Trophy }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-accent-red' : 'text-ink-light hover:text-ink'}`}>
                    <tab.icon className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
                    {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-red" />}
                  </button>
                ))}
              </div>

              <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'combat' && (
                    <motion.div key="combat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Ataques e Conjurações</h3>
                          <Tooltip text="Armas e magias de ataque. Adicione o bônus de acerto e o dano rolado.">
                            <Info className="w-4 h-4 text-ink/30 cursor-help" />
                          </Tooltip>
                        </div>
                        <button onClick={addAttack} className="p-1.5 bg-ink text-parchment rounded-sm hover:bg-ink-light transition-colors border border-gold"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-3">
                        {char.attacks.map((attack) => (
                          <div key={attack.id} className="bg-parchment/50 p-3 rounded-sm border border-gold/30 flex flex-wrap sm:flex-nowrap items-center gap-3 group shadow-inner">
                            <div className="flex-1 min-w-[120px]">
                              <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest mb-1">Nome do Ataque</div>
                              <input type="text" value={attack.name} onChange={(e) => updateAttack(attack.id, 'name', e.target.value)} className="ff-input w-full text-sm py-1" />
                            </div>
                            <div className="w-20">
                              <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest text-center mb-1">Bônus</div>
                              <input type="number" value={attack.bonus} onChange={(e) => updateAttack(attack.id, 'bonus', parseInt(e.target.value) || 0)} className="ff-input w-full text-center text-sm py-1" />
                            </div>
                            <div className="w-24">
                              <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest text-center mb-1">Dano/Tipo</div>
                              <input type="text" value={attack.damage} onChange={(e) => updateAttack(attack.id, 'damage', e.target.value)} className="ff-input w-full text-center text-sm py-1" />
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRoll([`1d20${formatMod(attack.bonus)}`, attack.damage], attack.name)}
                                className="bg-accent-red text-white px-3 py-1 rounded-sm text-xs font-bold uppercase hover:bg-accent-red/80 transition-all flex items-center gap-1"
                              >
                                <Sword className="w-3 h-3" /> Rolar
                              </button>
                              <button onClick={() => removeAttack(attack.id)} className="text-ink/30 hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                        {char.attacks.length === 0 && <div className="text-center py-12 border-2 border-dashed border-gold/30 rounded-sm text-ink/40 italic">Nenhum ataque adicionado</div>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'equipment' && (
                    <motion.div key="equipment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      {/* Weight Display */}
                      <div className={`ff-panel p-4 flex justify-between items-center ${isOverweight ? 'border-accent-red bg-accent-red/5' : ''}`}>
                        <div className="flex items-center gap-2">
                          <Backpack className={`w-5 h-5 ${isOverweight ? 'text-accent-red' : 'text-gold'}`} />
                          <span className="text-sm font-bold uppercase tracking-widest ff-title">Peso de Carga</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${isOverweight ? 'text-accent-red' : 'text-ink'}`}>{totalWeight.toFixed(1)}</span>
                          <span className="text-ink/30">/</span>
                          <span className="text-sm font-medium text-ink/50">{weightLimit} kg</span>
                        </div>
                      </div>
                      
                      {/* Coins */}
                      <div className="bg-parchment/50 p-4 rounded-sm border border-gold/30 shadow-inner">
                        <div className="text-[10px] font-bold uppercase text-ink-light mb-3 tracking-widest text-center ff-title">Moedas</div>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { key: 'cp', label: 'PC', color: 'text-amber-700' },
                            { key: 'sp', label: 'PE', color: 'text-slate-500' },
                            { key: 'ep', label: 'PL', color: 'text-yellow-600' },
                            { key: 'gp', label: 'PO', color: 'text-yellow-500' },
                            { key: 'pp', label: 'PP', color: 'text-slate-300' }
                          ].map(coin => (
                            <div key={coin.key} className="flex flex-col items-center">
                              <div className={`text-[10px] font-bold ${coin.color}`}>{coin.label}</div>
                              <input type="number" value={(char.coins as any)[coin.key]} onChange={(e) => updateCoin(coin.key as any, parseInt(e.target.value) || 0)} className="ff-input w-full text-center mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Inventário</h3>
                          <Tooltip text="Gerencie os itens que carrega em sua mochila.">
                            <Info className="w-4 h-4 text-ink/30 cursor-help" />
                          </Tooltip>
                        </div>
                        <button onClick={addInventoryItem} className="p-1.5 bg-ink text-parchment rounded-sm hover:bg-ink-light transition-colors border border-gold"><Plus className="w-4 h-4" /></button>
                      </div>
                      
                      <div className="space-y-3">
                        {char.inventory.map((item) => (
                          <div key={item.id} className="bg-parchment/50 p-4 rounded-sm border border-gold/30 space-y-3 group shadow-inner">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                              <div className="flex-1 min-w-[120px]">
                                <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest mb-1">Nome do Item</div>
                                <input type="text" value={item.name} onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)} className="ff-input w-full text-sm py-1" />
                              </div>
                              <div className="w-16">
                                <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest text-center mb-1">Qtd</div>
                                <input type="number" value={item.quantity} onChange={(e) => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="ff-input w-full text-center text-sm py-1" />
                              </div>
                              <div className="w-20">
                                <div className="text-[8px] uppercase font-bold text-ink/50 tracking-widest text-center mb-1">Peso</div>
                                <input type="text" value={item.weight} onChange={(e) => updateInventoryItem(item.id, 'weight', e.target.value)} className="ff-input w-full text-center text-sm py-1" />
                              </div>
                              <div className="w-8 flex justify-end">
                                <button onClick={() => removeInventoryItem(item.id)} className="text-ink/30 hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <textarea value={item.description} onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)} placeholder="Descrição do item..." className="ff-textarea w-full p-2 rounded-sm text-xs h-16 resize-none mt-2" />
                          </div>
                        ))}
                        {char.inventory.length === 0 && <div className="text-center py-12 border-2 border-dashed border-gold/30 rounded-sm text-ink/40 italic">Inventário vazio</div>}
                      </div>

                      <div className="pt-6 border-t border-gold/30">
                        <div className="text-[10px] font-bold uppercase text-ink-light mb-2 px-1">Notas Adicionais de Equipamento</div>
                        <textarea value={char.equipment} onChange={(e) => updateField('equipment', e.target.value)} placeholder="Moedas, tesouros, notas..." className="ff-textarea w-full h-32 p-4 rounded-sm resize-none font-medium text-sm" />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'spells' && (
                    <motion.div key="spells" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                      {/* Spellcasting Header */}
                      <div className="bg-parchment/50 p-4 rounded-sm border border-gold/30 grid grid-cols-4 gap-4 shadow-inner">
                        <div className="text-center col-span-1">
                          <div className="text-[10px] uppercase font-bold text-ink/50">Classe</div>
                          <input type="text" value={char.spellcastingClass} onChange={(e) => updateField('spellcastingClass', e.target.value)} className="bg-transparent font-bold outline-none text-ink w-full text-center border-b border-transparent focus:border-gold/30" placeholder="Ex: Mago" />
                        </div>
                        <div className="text-center col-span-1 border-l border-gold/30">
                          <div className="text-[10px] uppercase font-bold text-ink/50">Habilidade</div>
                          <select value={char.spellcastingAbility} onChange={(e) => updateField('spellcastingAbility', e.target.value as Ability)} className="bg-transparent font-bold outline-none text-accent-red w-full text-center">
                            {Object.keys(ABILITY_LABELS).map(a => <option key={a} value={a} className="bg-parchment text-ink">{a}</option>)}
                          </select>
                        </div>
                        <div className="text-center col-span-1 border-l border-gold/30">
                          <div className="text-[10px] uppercase font-bold text-ink/50">CD Magia</div>
                          <div className="text-xl font-bold ff-title">{8 + profBonus + getMod(char.abilities[char.spellcastingAbility])}</div>
                        </div>
                        <div className="text-center col-span-1 border-l border-gold/30">
                          <div className="text-[10px] uppercase font-bold text-ink/50">Ataque</div>
                          <div className="text-xl font-bold ff-title">{formatMod(profBonus + getMod(char.abilities[char.spellcastingAbility]))}</div>
                        </div>
                      </div>

                      {/* Spell Filters */}
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                            <input 
                              type="text" 
                              value={spellSearch} 
                              onChange={(e) => setSpellSearch(e.target.value)} 
                              placeholder="Buscar magia..." 
                              className="ff-input w-full pl-10 py-2"
                            />
                          </div>
                          <button 
                            onClick={() => setSpellFilter(prev => ({ ...prev, prepared: prev.prepared === 'all' ? true : (prev.prepared === true ? false : 'all') }))}
                            className={`px-3 py-2 rounded-sm border transition-all text-xs font-bold uppercase ${spellFilter.prepared === 'all' ? 'border-gold/30 text-ink/30' : 'border-accent-red text-accent-red bg-accent-red/5'}`}
                          >
                            {spellFilter.prepared === 'all' ? 'Todas' : (spellFilter.prepared ? 'Preparadas' : 'Não Prep.')}
                          </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {['all', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                            <button 
                              key={lvl}
                              onClick={() => setSpellFilter(prev => ({ ...prev, level: lvl as any }))}
                              className={`px-3 py-1 rounded-sm border text-[10px] font-bold whitespace-nowrap transition-all ${spellFilter.level === lvl ? 'bg-ink text-parchment border-ink' : 'border-gold/30 text-ink/50 hover:border-gold'}`}
                            >
                              {lvl === 'all' ? 'Todos Níveis' : `Nível ${lvl}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Spell Slots */}
                      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                          <div key={lvl} className="bg-parchment/50 p-2 rounded-sm border border-gold/30 text-center shadow-inner">
                            <div className="text-[8px] uppercase font-bold text-ink/50 mb-1">Nível {lvl}</div>
                            <div className="flex flex-col gap-1">
                              <input type="number" value={char.spellSlots[lvl].used} onChange={(e) => updateSpellSlot(lvl, 'used', parseInt(e.target.value) || 0)} className="bg-accent-red/10 text-accent-red text-xs font-bold w-full text-center rounded-sm outline-none border border-transparent focus:border-accent-red/30" placeholder="U" />
                              <div className="h-[1px] bg-gold/30" />
                              <input type="number" value={char.spellSlots[lvl].total} onChange={(e) => updateSpellSlot(lvl, 'total', parseInt(e.target.value) || 0)} className="bg-ink/5 text-ink text-xs font-bold w-full text-center rounded-sm outline-none border border-transparent focus:border-gold/30" placeholder="T" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Spell List */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Magias Conhecidas ({filteredSpells.length})</h3>
                            <Tooltip text="Lista de magias conhecidas. Marque a bolinha para preparar a magia.">
                              <Info className="w-4 h-4 text-ink/30 cursor-help" />
                            </Tooltip>
                          </div>
                          <button onClick={addSpell} className="p-1.5 bg-ink text-parchment rounded-sm hover:bg-ink-light transition-colors border border-gold"><Plus className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-4">
                          {filteredSpells.map((spell) => (
                            <div key={spell.id} className="bg-parchment/50 rounded-sm border border-gold/30 overflow-hidden group shadow-inner">
                              <div className="p-4 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1 flex justify-center">
                                  <div onClick={() => updateSpell(spell.id, 'prepared', !spell.prepared)} className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${spell.prepared ? 'bg-accent-red border-accent-red shadow-[0_0_8px_rgba(139,37,0,0.5)]' : 'border-gold/50'}`} />
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
                                        const attackBonus = profBonus + getMod(char.abilities[char.spellcastingAbility]);
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
                              
                              <div className="px-4 pb-4 grid grid-cols-3 gap-4">
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
                              </div>
                              <div className="px-4 pb-4">
                                <textarea value={spell.description} onChange={(e) => updateSpell(spell.id, 'description', e.target.value)} placeholder="Descrição da magia..." className="ff-textarea w-full p-2 rounded-sm text-xs h-20 resize-none" />
                              </div>
                            </div>
                          ))}
                          {char.spells.length === 0 && <div className="text-center py-12 border-2 border-dashed border-gold/30 rounded-sm text-ink/40 italic">Nenhuma magia adicionada</div>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'details' && (
                    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {[
                          { label: 'Idade', field: 'age' }, { label: 'Altura', field: 'height' }, { label: 'Peso', field: 'weight' },
                          { label: 'Olhos', field: 'eyes' }, { label: 'Pele', field: 'skin' }, { label: 'Cabelos', field: 'hair' }
                        ].map(item => (
                          <div key={item.field} className="bg-parchment/50 p-2 rounded-sm border border-gold/30 flex flex-col items-center justify-center shadow-inner">
                            <input type="text" value={(char as any)[item.field]} onChange={(e) => updateField(item.field as any, e.target.value)} className="bg-transparent w-full text-center font-bold text-ink outline-none border-b border-gold/30 focus:border-accent-red text-sm" />
                            <div className="text-[8px] uppercase font-bold text-ink-light text-center mt-1 tracking-widest">{item.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Aparência do Personagem</div>
                          <textarea value={char.appearance} onChange={(e) => updateField('appearance', e.target.value)} className="ff-textarea w-full h-40 p-3 rounded-sm resize-none text-sm" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Retrato do Personagem</div>
                          <div className="flex flex-col gap-2 h-auto sm:h-40">
                            <div className="flex gap-2">
                              <input type="text" value={char.portrait.startsWith('data:') ? '' : char.portrait} onChange={(e) => updateField('portrait', e.target.value)} placeholder="URL da Imagem..." className="ff-input flex-1 px-2 py-1 text-sm" />
                              <label className="bg-ink text-parchment px-3 py-1 rounded-sm text-xs font-bold cursor-pointer hover:bg-ink-light transition-colors flex items-center gap-2">
                                <Upload className="w-3 h-3" />
                                <span>Upload</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </label>
                            </div>
                            <div className="flex-1 bg-parchment/50 border border-gold/30 rounded-sm flex items-center justify-center overflow-hidden shadow-inner relative min-h-[150px]">
                              {char.portrait ? (
                                <img src={char.portrait} alt="Retrato" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-ink/30 flex flex-col items-center gap-2">
                                  <User className="w-8 h-8" />
                                  <span className="text-xs font-bold uppercase tracking-widest">Sem Imagem</span>
                                </div>
                              )}
                              {char.portrait && (
                                <button onClick={() => updateField('portrait', '')} className="absolute top-1 right-1 bg-accent-red text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">História do Personagem</div>
                          <textarea value={char.backstory} onChange={(e) => updateField('backstory', e.target.value)} className="ff-textarea w-full h-64 p-4 rounded-sm resize-none text-sm" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Aliados e Organizações</div>
                          <textarea value={char.allies} onChange={(e) => updateField('allies', e.target.value)} className="ff-textarea w-full h-64 p-3 rounded-sm resize-none text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Outras Características e Habilidades</div>
                          <textarea value={char.additionalFeatures} onChange={(e) => updateField('additionalFeatures', e.target.value)} className="ff-textarea w-full h-40 p-3 rounded-sm resize-none text-sm" />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Tesouro</div>
                          <textarea value={char.treasure} onChange={(e) => updateField('treasure', e.target.value)} className="ff-textarea w-full h-40 p-3 rounded-sm resize-none text-sm" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'features' && (
                    <motion.div key="features" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Habilidades de Classe</div>
                        <textarea value={char.classFeatures} onChange={(e) => updateField('classFeatures', e.target.value)} placeholder="Habilidades recebidas pela sua classe..." className="ff-textarea w-full h-40 p-4 rounded-sm resize-none font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase text-ink-light px-1 ff-title">Traços Raciais e Outras Habilidades</div>
                        <textarea value={char.features} onChange={(e) => updateField('features', e.target.value)} placeholder="Habilidades de raça, talentos..." className="ff-textarea w-full h-40 p-4 rounded-sm resize-none font-medium text-sm" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Personality & Background */}
          <div className="lg:col-span-3 space-y-6">
            <div className="ff-panel p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-gold/30 pb-2">
                <User className="w-5 h-5 text-accent-red" />
                <span className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Personalidade</span>
              </div>
              
              {[
                { label: 'Traços de Personalidade', field: 'traits' },
                { label: 'Ideais', field: 'ideals' },
                { label: 'Ligações', field: 'bonds' },
                { label: 'Defeitos', field: 'flaws' }
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-ink-light px-1">{item.label}</div>
                  <textarea value={(char.personality as any)[item.field]} onChange={(e) => setChar(prev => ({ ...prev, personality: { ...prev.personality, [item.field]: e.target.value } }))} className="ff-textarea w-full p-2 rounded-sm resize-none text-sm min-h-[60px]" />
                </div>
              ))}
            </div>

            <div className="ff-panel p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gold/30 pb-2">
                <Settings className="w-5 h-5 text-ink-light" />
                <span className="text-sm font-bold uppercase tracking-widest text-ink ff-title">Idiomas e Outras Proficiências</span>
              </div>
              <textarea value={char.languages} onChange={(e) => updateField('languages', e.target.value)} placeholder="Idiomas, proficiências em ferramentas, etc..." className="ff-textarea w-full h-40 p-3 rounded-sm resize-none text-sm" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-parchment-light/95 dark:bg-parchment/95 backdrop-blur-md border-t border-gold/30 lg:hidden flex justify-around items-center py-2 px-1 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        {[
          { id: 'combat', label: 'Combate', icon: Sword },
          { id: 'spells', label: 'Magias', icon: ScrollText },
          { id: 'equipment', label: 'Itens', icon: Backpack },
          { id: 'details', label: 'Bio', icon: BookOpen },
          { id: 'features', label: 'Traços', icon: Trophy }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === tab.id ? 'text-accent-red' : 'text-ink-light'}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
        <button 
          onClick={() => {
            const historyStr = rollHistory.map(r => `🎲 ${r.label}: ${r.total}`).join('\n');
            alert(historyStr || 'Nenhuma rolagem no histórico');
          }}
          className="flex flex-col items-center gap-1 text-ink-light flex-1"
        >
          <History className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Log</span>
        </button>
      </div>

      <footer className="mt-12 py-8 border-t border-gold/30 text-center text-ink/40 text-xs font-medium pb-24 lg:pb-8">
        <p className="ff-title">Inspirado no D&D Beyond & Final Fantasy XII • Criado para RPGistas</p>
      </footer>

      {/* Hidden Full Sheet for Export */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={exportRef} className="w-[1200px] p-12 bg-parchment-light space-y-12">
          <div className="text-center border-b-4 border-gold pb-6">
            <h1 className="text-6xl font-bold ff-title text-ink">{char.name || 'Personagem Sem Nome'}</h1>
            <p className="text-xl text-ink-light uppercase tracking-[0.3em] mt-2">{char.classLevel} • {char.race}</p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Column 1: Stats & Skills */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(char.abilities) as Ability[]).map(a => (
                  <div key={a} className="ff-panel p-4 text-center">
                    <div className="text-xs font-bold uppercase text-ink-light">{ABILITY_LABELS[a]}</div>
                    <div className="text-4xl font-bold ff-title">{formatMod(getMod(char.abilities[a]))}</div>
                    <div className="text-sm font-bold text-ink/50">Score: {char.abilities[a]}</div>
                  </div>
                ))}
              </div>
              <div className="ff-panel p-6">
                <h3 className="ff-title text-lg border-b border-gold mb-4">Perícias</h3>
                <div className="space-y-2">
                  {char.skills.map(s => (
                    <div key={s.name} className="flex justify-between text-sm">
                      <span className={s.proficient ? 'font-bold text-accent-red' : ''}>{s.name}</span>
                      <span className="font-mono">{formatMod(getMod(char.abilities[s.ability]) + (s.proficient ? profBonus : 0) + (s.miscBonus || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Combat & Portrait */}
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="ff-panel p-4 text-center">
                  <div className="text-xs font-bold uppercase">AC</div>
                  <div className="text-3xl font-bold">{char.ac}</div>
                </div>
                <div className="ff-panel p-4 text-center">
                  <div className="text-xs font-bold uppercase">HP</div>
                  <div className="text-3xl font-bold">{char.hpCurrent}/{char.hpMax}</div>
                </div>
                <div className="ff-panel p-4 text-center">
                  <div className="text-xs font-bold uppercase">SPD</div>
                  <div className="text-3xl font-bold">{char.speed}</div>
                </div>
              </div>
              <div className="ff-panel aspect-square overflow-hidden">
                {char.portrait ? (
                  <img src={char.portrait} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/20"><User size={100} /></div>
                )}
              </div>
              <div className="ff-panel p-6">
                <h3 className="ff-title text-lg border-b border-gold mb-4">Ataques</h3>
                <div className="space-y-4">
                  {char.attacks.map(a => (
                    <div key={a.id} className="border-b border-gold/20 pb-2">
                      <div className="font-bold">{a.name}</div>
                      <div className="text-sm text-accent-red">{a.bonus} to hit • {a.damage} damage</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Features & Equipment */}
            <div className="space-y-8">
              <div className="ff-panel p-6">
                <h3 className="ff-title text-lg border-b border-gold mb-4">Personalidade</h3>
                <div className="space-y-4 text-sm italic">
                  <div><span className="font-bold uppercase text-[10px] not-italic">Traços:</span> {char.personality.traits}</div>
                  <div><span className="font-bold uppercase text-[10px] not-italic">Ideais:</span> {char.personality.ideals}</div>
                  <div><span className="font-bold uppercase text-[10px] not-italic">Ligações:</span> {char.personality.bonds}</div>
                  <div><span className="font-bold uppercase text-[10px] not-italic">Defeitos:</span> {char.personality.flaws}</div>
                </div>
              </div>
              <div className="ff-panel p-6">
                <h3 className="ff-title text-lg border-b border-gold mb-4">Habilidades</h3>
                <div className="text-sm whitespace-pre-wrap">{char.classFeatures}</div>
              </div>
              <div className="ff-panel p-6">
                <h3 className="ff-title text-lg border-b border-gold mb-4">Equipamento</h3>
                <div className="text-sm whitespace-pre-wrap">{char.equipment}</div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-ink/30 text-xs ff-title pt-12">
            Gerado via D&D 5e Sheet App • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
