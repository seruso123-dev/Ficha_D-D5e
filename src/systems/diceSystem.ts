import DiceBox from '@3d-dice/dice-box';

let diceBoxInstance: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export const initDiceBox = async (containerId: string) => {
  if (diceBoxInstance && !isInitializing) return diceBoxInstance;
  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  
  diceBoxInstance = new DiceBox(containerId, {
    assetPath: '/assets/dice-box/',
    theme: 'default',
    themeColor: '#a68a56',
    scale: 6,
    spinForce: 5,
    throwForce: 5,
    gravity: 2,
    mass: 1,
    friction: 0.8,
    restitution: 0.1,
    linearDamping: 0.4,
    angularDamping: 0.4,
    settleTimeout: 5000,
    startingHeight: 8,
    shadows: true,
    lightIntensity: 1
  });

  initPromise = diceBoxInstance.init().then(() => {
    isInitializing = false;
    return diceBoxInstance;
  }).catch((err: any) => {
    isInitializing = false;
    initPromise = null;
    diceBoxInstance = null;
    throw err;
  });

  return initPromise;
};

export const rollDice3D = async (formula: string, containerId: string = "#dice-box") => {
  const box = await initDiceBox(containerId);
  
  box.clear();
  
  // Clean up formula for dice-box
  const cleanFormula = formula.trim().replace(/\s+/g, '');
  
  // Parse the formula manually to extract the modifier for our UI
  const regex = /^(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i;
  const match = cleanFormula.match(regex);
  
  let dicePart = cleanFormula;
  let op = '';
  let mod = 0;
  
  if (match) {
    const count = match[1] || '1';
    const sides = match[2];
    dicePart = `${count}d${sides}`;
    op = match[3] || '';
    mod = match[4] ? parseInt(match[4]) : 0;
  }

  // Roll the dice
  const result = await box.roll(dicePart);
  
  // Format the result to match the old rollDice function
  // result is typically an array of groups
  const group = result[0];
  const rolls = group.rolls.map((r: any) => r.value);
  const sum = rolls.reduce((a: number, b: number) => a + b, 0);
  const total = op === '-' ? sum - mod : sum + mod;

  return { formula: cleanFormula, rolls, sum, op, mod, total };
};

export const clearDice = () => {
  if (diceBoxInstance) {
    diceBoxInstance.clear();
  }
};
