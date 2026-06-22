export const RATE_CONFIGS = {
  rate5152: { label: "51.52枚交換", medalsPerYen: 51.52 / 1000, unitLabel: "枚" },
  rate52: { label: "5.2枚交換", medalsPerYen: 5.2 / 100, unitLabel: "枚" },
  pachi4_28: { label: "4円パチンコ 28玉", medalsPerYen: 28 / 100, unitLabel: "玉" },
  pachi1_112: { label: "1円パチンコ 112玉", medalsPerYen: 112 / 100, unitLabel: "玉" },
  slot5_112: { label: "5円スロット 112枚", medalsPerYen: 112 / 100, unitLabel: "枚" },
};

export const DEFAULT_PRIZES = [500, 1000, 5000];
export const GROUP_MODES = {
  none: { label: "比重なし", strength: 0 },
  A: { label: "比重A", strength: 0.18 },
  B: { label: "比重B", strength: 0.34 },
};

export const RATE_CATEGORY_CONFIGS = {
  pachi4: {
    label: "4円パチンコ",
    unitLabel: "玉",
    yenPerUnit: 4,
    yenBase: 100,
    values: [25, 26, 27, 27.5, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  },
  pachi1: {
    label: "1円パチンコ",
    unitLabel: "玉",
    yenPerUnit: 1,
    yenBase: 100,
    values: [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 140, 150, 160],
  },
  slot20: {
    label: "20円スロ",
    unitLabel: "枚",
    yenPerUnit: 20,
    yenBase: 100,
    values: [5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6],
  },
  slot5: {
    label: "5円スロ",
    unitLabel: "枚",
    yenPerUnit: 5,
    yenBase: 1000,
    values: [200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 252, 256, 260, 264, 268, 272, 276, 280],
  },
};

const fmt = new Intl.NumberFormat("ja-JP");

export function formatNumber(value) {
  return fmt.format(value);
}

function rateConfigFor(rateType, rates = RATE_CONFIGS) {
  return rates[rateType] || RATE_CONFIGS[rateType] || RATE_CONFIGS.rate5152;
}

export function unitLabelFor(rateType, rates = RATE_CONFIGS) {
  return rateConfigFor(rateType, rates).unitLabel || "玉/枚";
}

export function requiredMedalsForYen(yen, rateType, rates = RATE_CONFIGS) {
  return Math.max(0, Math.ceil(yen * rateConfigFor(rateType, rates).medalsPerYen - 1e-9));
}

export function normalizePrizes(prizes) {
  const cleaned = (prizes || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.floor(value));
  return [...new Set(cleaned)].sort((a, b) => a - b);
}

function emptyCombo(prizes) {
  return Object.fromEntries(prizes.map((prize) => [prize, 0]));
}

function reachableYenSet(maxYen, prizes) {
  const reachable = new Array(maxYen + 1).fill(false);
  reachable[0] = true;
  for (let yen = 1; yen <= maxYen; yen++) {
    reachable[yen] = prizes.some((prize) => yen >= prize && reachable[yen - prize]);
  }
  return reachable;
}

function bestComboForYen(targetYen, prizes) {
  const previous = new Array(targetYen + 1).fill(null);
  const highFirst = [...prizes].sort((a, b) => b - a);
  previous[0] = 0;

  for (let yen = 1; yen <= targetYen; yen++) {
    for (const prize of highFirst) {
      if (yen >= prize && previous[yen - prize] !== null) {
        previous[yen] = prize;
        break;
      }
    }
  }

  if (previous[targetYen] === null) return null;
  const combo = emptyCombo(prizes);
  for (let yen = targetYen; yen > 0;) {
    const prize = previous[yen];
    combo[prize] += 1;
    yen -= prize;
  }
  return combo;
}

export function calculateExchange({ medals, rateType = "rate5152", prizes = DEFAULT_PRIZES, rates = RATE_CONFIGS }) {
  const totalMedals = Math.max(0, Math.floor(Number(medals) || 0));
  const selectedPrizes = normalizePrizes(prizes);
  const usablePrizes = selectedPrizes.length > 0 ? selectedPrizes : DEFAULT_PRIZES;
  const maxPrize = Math.max(...usablePrizes);
  const minPrize = Math.min(...usablePrizes);
  const maxSearchYen = Math.max(
    minPrize,
    Math.ceil(totalMedals / rateConfigFor(rateType, rates).medalsPerYen) + maxPrize * 2
  );
  const reachable = reachableYenSet(maxSearchYen, usablePrizes);

  let bestYen = 0;
  for (let yen = 1; yen <= maxSearchYen; yen++) {
    if (reachable[yen] && requiredMedalsForYen(yen, rateType, rates) <= totalMedals) bestYen = yen;
  }

  let nextYen = 0;
  for (let yen = bestYen + 1; yen <= maxSearchYen; yen++) {
    if (reachable[yen]) {
      nextYen = yen;
      break;
    }
  }

  const bestRequired = requiredMedalsForYen(bestYen, rateType, rates);
  const nextRequired = nextYen ? requiredMedalsForYen(nextYen, rateType, rates) : 0;

  return {
    rateType,
    prizes: usablePrizes,
    best: {
      yen: bestYen,
      requiredMedals: bestRequired,
      left: totalMedals - bestRequired,
      combo: bestComboForYen(bestYen, usablePrizes) || emptyCombo(usablePrizes),
    },
    next: {
      yen: nextYen,
      requiredMedals: nextRequired,
      shortage: Math.max(0, nextRequired - totalMedals),
      increaseYen: Math.max(0, nextYen - bestYen),
    },
    candidates: buildCandidates(bestYen, reachable, usablePrizes, rateType, totalMedals, rates),
  };
}

export function exchangeCalloutText({ result, unit }) {
  if (!result.next.yen) return "景品を1つ以上選んでください。";
  if (result.best.left === 0) return `余りは0${unit}です。`;
  return `あと${formatNumber(result.next.shortage)}${unit}`;
}

export function activePresetStatusText(name) {
  const trimmed = String(name || "").trim();
  return trimmed ? `${trimmed}を適用中` : "";
}

export function rateUnitHintText(unit) {
  return `100円あたりの${unit || "玉/枚"}数`;
}

function optionValueLabel(value, unit) {
  return `${formatNumber(value)}${unit}`;
}

function payoutLabel(value, config) {
  const yen = (config.yenBase || 100) / value;
  if (Math.abs(yen - config.yenPerUnit) < 0.001) return `${config.yenPerUnit}円等価`;
  return `${Math.floor(yen * 100) / 100}円`;
}

export function payoutYenPerUnit(value, yenBase = 100) {
  const rate = Number(value);
  const base = Number(yenBase) || 100;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return base / rate;
}

export function formatExchangeRateValue(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return "";
  return String(Math.round(rate * 1000) / 1000);
}

export function rateCategoryOptions(category) {
  const config = RATE_CATEGORY_CONFIGS[category];
  if (!config) return [];
  return config.values.map((value) => ({
    value: String(value),
    label: `${optionValueLabel(value, config.unitLabel)}（${payoutLabel(value, config)}）`,
  }));
}

export function buildRateConfigFromOption(category, optionValue) {
  const config = RATE_CATEGORY_CONFIGS[category];
  const value = Number(optionValue);
  if (!config || !Number.isFinite(value) || value <= 0) return null;
  return {
    label: `${config.label} ${optionValueLabel(value, config.unitLabel)}交換`,
    medalsPerYen: value / (config.yenBase || 100),
    unitLabel: config.unitLabel,
    category,
    exchangeRate: value,
    yenBase: config.yenBase || 100,
  };
}

function buildCandidates(bestYen, reachable, prizes, rateType, medals, rates) {
  const candidates = [];
  for (let yen = bestYen; yen >= 0 && candidates.length < 10; yen--) {
    if (!reachable[yen]) continue;
    const requiredMedals = requiredMedalsForYen(yen, rateType, rates);
    candidates.push({
      yen,
      requiredMedals,
      left: medals - requiredMedals,
      combo: bestComboForYen(yen, prizes) || emptyCombo(prizes),
    });
  }
  return candidates;
}

function roundToUnit(value, unit) {
  return Math.round(value / unit) * unit;
}

function groupRoundUnit(members) {
  return members.every((member) => member.investment % 1000 === 0 && member.recovery % 1000 === 0)
    ? 1000
    : 100;
}

export function computeGroupShares(totalProfit, performances, mode = "none", roundUnit = 100) {
  const total = Math.round(Number(totalProfit) || 0);
  const scores = performances.length > 0 ? performances.map((value) => Number(value) || 0) : [0];
  const config = GROUP_MODES[mode] || GROUP_MODES.none;
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const span = Math.max(...scores.map((value) => Math.abs(value - average)), 1);
  const weights = scores.map((value) => {
    if (config.strength === 0) return 1;
    const score = (value - average) / span;
    const direction = total >= 0 ? 1 : -1;
    return Math.max(0.25, 1 + score * config.strength * direction);
  });
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const rawShares = weights.map((weight) => (total * weight) / weightTotal);
  const rounded = rawShares.map((value) => roundToUnit(value, roundUnit));
  let remainder = total - rounded.reduce((sum, value) => sum + value, 0);
  const order = rawShares
    .map((value, index) => ({ index, fraction: Math.abs(value - rounded[index]) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; Math.abs(remainder) >= roundUnit && order.length > 0; i = (i + 1) % order.length) {
    const delta = remainder > 0 ? roundUnit : -roundUnit;
    rounded[order[i].index] += delta;
    remainder -= delta;
  }
  if (remainder !== 0 && order.length > 0) rounded[order[0].index] += remainder;

  return rounded;
}

export const computeProfitShares = computeGroupShares;

export function settleGroup(input) {
  const members = Array.isArray(input) ? input : input.members || [];
  const mode = Array.isArray(input) ? "none" : input.mode || "none";
  const normalized = members
    .map((member, index) => ({
      name: String(member.name || `メンバー${index + 1}`),
      investment: Math.max(0, Math.round(Number(member.investment) || 0)),
      recovery: Math.max(0, Math.round(Number(member.recovery) || 0)),
    }))
    .filter((member) => member.name.trim() !== "");

  const totalInvestment = normalized.reduce((sum, member) => sum + member.investment, 0);
  const totalRecovery = normalized.reduce((sum, member) => sum + member.recovery, 0);
  const totalProfit = totalRecovery - totalInvestment;
  const performances = normalized.map((member) => member.recovery - member.investment);
  const roundUnit = groupRoundUnit(normalized);
  const shares = computeGroupShares(totalProfit, performances, mode, roundUnit);

  const rows = normalized.map((member, index) => {
    const targetRecovery = member.investment + shares[index];
    const balance = roundToUnit(member.recovery - targetRecovery, roundUnit);
    return {
      ...member,
      performance: performances[index],
      targetNet: shares[index],
      targetRecovery,
      balance,
    };
  });

  return {
    totalInvestment,
    totalRecovery,
    totalProfit,
    mode,
    roundUnit,
    members: rows,
    payments: buildPayments(rows),
  };
}

function buildPayments(members) {
  const payers = members
    .filter((member) => member.balance > 0)
    .map((member) => ({ name: member.name, amount: member.balance }));
  const receivers = members
    .filter((member) => member.balance < 0)
    .map((member) => ({ name: member.name, amount: -member.balance }));
  const payments = [];
  let payerIndex = 0;
  let receiverIndex = 0;

  while (payerIndex < payers.length && receiverIndex < receivers.length) {
    const rawAmount = Math.min(payers[payerIndex].amount, receivers[receiverIndex].amount);
    const preferred = preferredPaymentAmount(rawAmount, payers[payerIndex].amount, receivers[receiverIndex].amount);
    const amount = Math.max(100, preferred);
    payments.push({ from: payers[payerIndex].name, to: receivers[receiverIndex].name, amount });
    payers[payerIndex].amount -= amount;
    receivers[receiverIndex].amount -= amount;
    if (payers[payerIndex].amount <= 0) payerIndex++;
    if (receivers[receiverIndex].amount <= 0) receiverIndex++;
  }

  return payments;
}

function preferredPaymentAmount(rawAmount, payerAmount, receiverAmount) {
  const amount = Math.min(rawAmount, payerAmount, receiverAmount);
  if (amount >= 1000 && amount % 1000 !== 0) {
    const rounded = Math.floor(amount / 1000) * 1000;
    if (rounded >= 100 && payerAmount - rounded >= 0 && receiverAmount - rounded >= 0) return rounded;
  }
  if (amount >= 500 && amount % 500 !== 0) {
    const rounded = Math.floor(amount / 500) * 500;
    if (rounded >= 100 && payerAmount - rounded >= 0 && receiverAmount - rounded >= 0) return rounded;
  }
  return roundToUnit(amount, 100);
}

export function evaluateCalculatorExpression(expression) {
  const tokens = String(expression).replace(/\s+/g, "").match(/\d+|[+-]/g) || [];
  let total = 0;
  let sign = 1;
  let hasNumber = false;

  for (const token of tokens) {
    if (token === "+") sign = 1;
    else if (token === "-") sign = -1;
    else {
      total += sign * Number(token);
      hasNumber = true;
    }
  }

  return hasNumber ? total : 0;
}

export function nextMemberName(members) {
  const used = new Set(members.map((member) => String(member.name || "").trim()).filter(Boolean));
  for (let i = 0; i < 26; i++) {
    const name = String.fromCharCode(65 + i);
    if (!used.has(name)) return name;
  }
  return `メンバー${members.length + 1}`;
}

export function deletePrizeType({ prizeTypes, selectedPrizes, presets, prize }) {
  const target = Number(prize);
  const filterPrize = (value) => Number(value) !== target;
  return {
    prizeTypes: normalizePrizes(prizeTypes).filter(filterPrize),
    selectedPrizes: normalizePrizes(selectedPrizes).filter(filterPrize),
    presets: (presets || []).map((preset) => ({
      ...preset,
      prizes: normalizePrizes(preset.prizes).filter(filterPrize),
    })),
  };
}

export function updatePresetAtIndex({ presets, index, updates }) {
  const selectedIndex = Number(index);
  const list = Array.isArray(presets) ? presets : [];
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= list.length) {
    return { presets: list, updated: null };
  }
  const cleanedUpdates = { ...(updates || {}) };
  if ("prizes" in cleanedUpdates) cleanedUpdates.prizes = normalizePrizes(cleanedUpdates.prizes);
  if ("prizeValues" in cleanedUpdates) cleanedUpdates.prizeValues = normalizePrizes(cleanedUpdates.prizeValues);
  const next = [...list];
  next[selectedIndex] = {
    ...next[selectedIndex],
    ...cleanedUpdates,
  };
  return {
    presets: next,
    updated: next[selectedIndex],
  };
}

export function selectedPresetIndex(value, presets = null) {
  if (value === "") return null;
  const selectedIndex = Number(value);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0) return null;
  if (Array.isArray(presets) && selectedIndex >= presets.length) return null;
  return selectedIndex;
}

export function movePreset({ presets, index, direction }) {
  const list = Array.isArray(presets) ? presets : [];
  const selectedIndex = selectedPresetIndex(String(index), list);
  const step = Math.sign(Number(direction) || 0);
  if (selectedIndex === null || step === 0) return { presets: list, index: selectedIndex };
  const nextIndex = selectedIndex + step;
  if (nextIndex < 0 || nextIndex >= list.length) return { presets: list, index: selectedIndex };
  const next = [...list];
  [next[selectedIndex], next[nextIndex]] = [next[nextIndex], next[selectedIndex]];
  return { presets: next, index: nextIndex };
}

export function deleteRateType({ customRates, currentRateType, presets, rateType, fallbackRateType = "rate5152" }) {
  const nextRates = { ...(customRates || {}) };
  delete nextRates[rateType];
  return {
    customRates: nextRates,
    currentRateType: currentRateType === rateType ? fallbackRateType : currentRateType,
    presets: (presets || []).map((preset) => ({
      ...preset,
      rateType: preset.rateType === rateType ? fallbackRateType : preset.rateType,
    })),
  };
}
