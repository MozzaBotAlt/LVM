from pathlib import Path
import json

elements = [
    {"symbol":"H","name":"Hydrogen","atomicNumber":1,"color":"#FFFFFF","state":"gas"},
    {"symbol":"He","name":"Helium","atomicNumber":2,"color":"#D9FFFF","state":"gas"},
    {"symbol":"Li","name":"Lithium","atomicNumber":3,"color":"#CC80FF","state":"solid"},
    {"symbol":"Be","name":"Beryllium","atomicNumber":4,"color":"#C2FF00","state":"solid"},
    {"symbol":"B","name":"Boron","atomicNumber":5,"color":"#FFB5B5","state":"solid"},
    {"symbol":"C","name":"Carbon","atomicNumber":6,"color":"#909090","state":"solid"},
    {"symbol":"N","name":"Nitrogen","atomicNumber":7,"color":"#3050F8","state":"gas"},
    {"symbol":"O","name":"Oxygen","atomicNumber":8,"color":"#FF0D0D","state":"gas"},
    {"symbol":"F","name":"Fluorine","atomicNumber":9,"color":"#90E050","state":"gas"},
    {"symbol":"Ne","name":"Neon","atomicNumber":10,"color":"#B3E3F5","state":"gas"},
    {"symbol":"Na","name":"Sodium","atomicNumber":11,"color":"#AB5CF2","state":"solid"},
    {"symbol":"Mg","name":"Magnesium","atomicNumber":12,"color":"#8AFF00","state":"solid"},
    {"symbol":"Al","name":"Aluminium","atomicNumber":13,"color":"#BFA6A6","state":"solid"},
    {"symbol":"Si","name":"Silicon","atomicNumber":14,"color":"#F0C8A0","state":"solid"},
    {"symbol":"P","name":"Phosphorus","atomicNumber":15,"color":"#FF8000","state":"solid"},
    {"symbol":"S","name":"Sulfur","atomicNumber":16,"color":"#FFFF30","state":"solid"},
    {"symbol":"Cl","name":"Chlorine","atomicNumber":17,"color":"#1FF01F","state":"gas"},
    {"symbol":"Ar","name":"Argon","atomicNumber":18,"color":"#80D1E3","state":"gas"},
    {"symbol":"K","name":"Potassium","atomicNumber":19,"color":"#8F40D4","state":"solid"},
    {"symbol":"Ca","name":"Calcium","atomicNumber":20,"color":"#3DFF00","state":"solid"},
]

reactions = [
    {
        "id":"hydrogen_combustion",
        "name":"Hydrogen Combustion",
        "equation":"2H2 + O2 -> 2H2O",
        "description":"Hydrogen burns in oxygen producing water.",
        "reactants":["H2","O2"],
        "products":["H2O"],
        "requiresHeat":True,
        "requiresWaterBath":False,
        "reactantColors":{"H2":"#FFFFFF","O2":"#FF0D0D"},
        "reactionColor":"#87CEEB",
        "productColors":{"H2O":"#ADD8E6"},
        "steps":[
            "Add hydrogen gas to reaction chamber",
            "Introduce oxygen gas",
            "Ignite with spark",
            "Observe pale blue flame and water formation"
        ]
    },
    {
        "id":"sodium_water",
        "name":"Sodium + Water",
        "equation":"2Na + 2H2O -> 2NaOH + H2",
        "description":"Highly exothermic alkali metal reaction.",
        "reactants":["Na","H2O"],
        "products":["NaOH","H2"],
        "requiresHeat":False,
        "requiresWaterBath":False,
        "reactantColors":{"Na":"#C0C0C0","H2O":"#ADD8E6"},
        "reactionColor":"#FFD700",
        "productColors":{"NaOH":"#FFFFFF","H2":"#FFFFFF"},
        "steps":[
            "Place water in beaker",
            "Add small sodium piece",
            "Observe fizzing and movement",
            "Hydrogen gas released"
        ]
    },
    {
        "id":"magnesium_oxygen",
        "name":"Magnesium Combustion",
        "equation":"2Mg + O2 -> 2MgO",
        "description":"Bright combustion of magnesium ribbon.",
        "reactants":["Mg","O2"],
        "products":["MgO"],
        "requiresHeat":True,
        "requiresWaterBath":False,
        "reactantColors":{"Mg":"#C0C0C0","O2":"#FF0D0D"},
        "reactionColor":"#FFFFFF",
        "productColors":{"MgO":"#F8F8FF"},
        "steps":[
            "Hold magnesium ribbon with tongs",
            "Ignite ribbon",
            "Observe intense white light",
            "Collect white ash"
        ]
    },
    {
        "id":"calcium_water",
        "name":"Calcium + Water",
        "equation":"Ca + 2H2O -> Ca(OH)2 + H2",
        "description":"Moderate alkaline earth reaction.",
        "reactants":["Ca","H2O"],
        "products":["Ca(OH)2","H2"],
        "requiresHeat":False,
        "requiresWaterBath":False,
        "reactantColors":{"Ca":"#D3D3D3","H2O":"#ADD8E6"},
        "reactionColor":"#F5F5F5",
        "productColors":{"Ca(OH)2":"#FFFFFF","H2":"#FFFFFF"},
        "steps":[
            "Add water to test tube",
            "Introduce calcium metal",
            "Observe bubbling",
            "Solution becomes cloudy"
        ]
    },
    {
        "id":"iron_sulfur",
        "name":"Iron + Sulfur",
        "equation":"Fe + S -> FeS",
        "description":"Formation of iron sulfide.",
        "reactants":["Fe","S"],
        "products":["FeS"],
        "requiresHeat":True,
        "requiresWaterBath":False,
        "reactantColors":{"Fe":"#B0B0B0","S":"#FFFF30"},
        "reactionColor":"#FF4500",
        "productColors":{"FeS":"#2F2F2F"},
        "steps":[
            "Mix iron filings and sulfur powder",
            "Heat mixture strongly",
            "Observe glow",
            "Black solid forms"
        ]
    },
    {
        "id":"chlorine_sodium",
        "name":"Sodium + Chlorine",
        "equation":"2Na + Cl2 -> 2NaCl",
        "description":"Halogen-metal synthesis.",
        "reactants":["Na","Cl2"],
        "products":["NaCl"],
        "requiresHeat":True,
        "requiresWaterBath":False,
        "reactantColors":{"Na":"#C0C0C0","Cl2":"#ADFF2F"},
        "reactionColor":"#FFA500",
        "productColors":{"NaCl":"#FFFFFF"},
        "steps":[
            "Heat sodium metal",
            "Introduce chlorine gas",
            "Observe vigorous reaction",
            "White salt forms"
        ]
    }
]

data = {
    "elements": elements,
    "experiments": reactions
}

json_path = Path("./dataset.json")
js_path = Path("./dataset.js")

with open(json_path, "w") as f:
    json.dump(data, f, indent=2)

js_content = "const PTE_REACTIONS_DATASET = " + json.dumps(data, indent=2) + ";\n\nexport default PTE_REACTIONS_DATASET;"
with open(js_path, "w") as f:
    f.write(js_content)

print(f"Created: {json_path}")
print(f"Created: {js_path}")
