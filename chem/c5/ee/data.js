// reactions.js - Reaction Data
const reactionsData = [
  {
    id: "combustion_methane",
    name: "Combustion of Methane",
    type: "exothermic",
    equation: "CH₄(g) + 2O₂(g) ➔ CO₂(g) + 2H₂O(l)",
    description:
      "A highly exothermic reaction where methane burns in oxygen releasing heat. This is an example of a combustion reaction.",
    enthalpyChange: -890,
    activationEnergy: 250,
    catalyzedActivationEnergy: null,
    reactants: [
      {
        name: "Methane",
        formula: "CH₄",
        color: "#888888",
        size: 1.2,
        count: 5,
      },
      { name: "Oxygen", formula: "O₂", color: "#ff4444", size: 1.0, count: 10 },
    ],
    products: [
      {
        name: "Carbon Dioxide",
        formula: "CO₂",
        color: "#555555",
        size: 1.3,
        count: 5,
      },
      { name: "Water", formula: "H₂O", color: "#4444ff", size: 1.1, count: 10 },
    ],
    initialTemp: 25,
    finalTempChange: 80,
  },
  {
    id: "thermal_decomp_caco3",
    name: "Thermal Decomposition of Calcium Carbonate",
    type: "endothermic",
    equation: "CaCO₃(s) ➔ CaO(s) + CO₂(g)",
    description:
      "Requires constant strong heat to break down the compound. Used industrially in lime production.",
    enthalpyChange: 178,
    activationEnergy: 400,
    catalyzedActivationEnergy: null,
    reactants: [
      {
        name: "Calcium Carbonate",
        formula: "CaCO₃",
        color: "#dddddd",
        size: 1.5,
        count: 8,
      },
    ],
    products: [
      {
        name: "Calcium Oxide",
        formula: "CaO",
        color: "#ffffff",
        size: 1.2,
        count: 8,
      },
      {
        name: "Carbon Dioxide",
        formula: "CO₂",
        color: "#555555",
        size: 1.3,
        count: 8,
      },
    ],
    initialTemp: 25,
    finalTempChange: -15,
  },
  {
    id: "neutralization",
    name: "Neutralization (HCl + NaOH)",
    type: "exothermic",
    equation: "HCl(aq) + NaOH(aq) ➔ NaCl(aq) + H₂O(l)",
    description:
      "Acid reacts with alkali. Exothermic reaction forming salt and water. Quick reaction with visible heat release.",
    enthalpyChange: -57,
    activationEnergy: 50,
    catalyzedActivationEnergy: null,
    reactants: [
      {
        name: "Hydrogen Chloride",
        formula: "HCl",
        color: "#aaffaa",
        size: 1.1,
        count: 8,
      },
      {
        name: "Sodium Hydroxide",
        formula: "NaOH",
        color: "#ffaaaa",
        size: 1.2,
        count: 8,
      },
    ],
    products: [
      {
        name: "Sodium Chloride",
        formula: "NaCl",
        color: "#ffffff",
        size: 1.2,
        count: 8,
      },
      { name: "Water", formula: "H₂O", color: "#4444ff", size: 1.1, count: 8 },
    ],
    initialTemp: 25,
    finalTempChange: 15,
  },
  {
    id: "dissolving_nh4no3",
    name: "Dissolving Ammonium Nitrate",
    type: "endothermic",
    equation: "NH₄NO₃(s) + H₂O(l) ➔ NH₄⁺(aq) + NO₃⁻(aq)",
    description:
      "A classic endothermic physical change/reaction used in cold packs. Temperature drops significantly.",
    enthalpyChange: 26,
    activationEnergy: 40,
    catalyzedActivationEnergy: null,
    reactants: [
      {
        name: "Ammonium Nitrate",
        formula: "NH₄NO₃",
        color: "#ccccff",
        size: 1.4,
        count: 12,
      },
    ],
    products: [
      {
        name: "Ammonium Ion",
        formula: "NH₄⁺",
        color: "#aaaaff",
        size: 1.1,
        count: 12,
      },
      {
        name: "Nitrate Ion",
        formula: "NO₃⁻",
        color: "#ffaaaa",
        size: 1.3,
        count: 12,
      },
    ],
    initialTemp: 25,
    finalTempChange: -18,
  },
  {
    id: "hydrogen_peroxide",
    name: "Decomposition of Hydrogen Peroxide",
    type: "exothermic",
    equation: "2H₂O₂(aq) ➔ 2H₂O(l) + O₂(g)",
    description:
      "Can be catalyzed by Manganese(IV) oxide (MnO₂) to speed up the reaction. Shows catalyst effect clearly.",
    enthalpyChange: -196,
    activationEnergy: 180,
    catalyzedActivationEnergy: 75,
    reactants: [
      {
        name: "Hydrogen Peroxide",
        formula: "H₂O₂",
        color: "#aaddff",
        size: 1.2,
        count: 12,
      },
    ],
    products: [
      { name: "Water", formula: "H₂O", color: "#4444ff", size: 1.1, count: 12 },
      { name: "Oxygen", formula: "O₂", color: "#ff4444", size: 1.0, count: 6 },
    ],
    initialTemp: 25,
    finalTempChange: 45,
  },
];

// Export for use in HTML
if (typeof module !== "undefined" && module.exports) {
  module.exports = { reactionsData };
}
