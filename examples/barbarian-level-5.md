Below is an example of calculating rage damage.

````
```dnd-character-stats
class: Barbarian
pb: 3
level: 5
speed: 30
barbarianClassFeatures:
  rages:
    "1": 2
    "2": 2
    "3": 3
    "4": 3
    "5": 3
    "6": 4
    "7": 4
    "8": 4
    "9": 4
    "10": 4
    "11": 4
    "12": 5
  rageDamage:
    "1": 2
    "2": 2
    "3": 2
    "4": 2
    "5": 2
    "6": 2
    "7": 2
    "8": 2
    "9": 3
    "10": 3
    "11": 3
    "12": 3
barbarian:
  extraSpeed: 10
  rageDamage: "{{ barbarianClassFeatures.rageDamage[level] }}"
health:
  hitDiceMax: 5
  hitDiceUsed: 0
  hp: 55
  hitDie: d12
  hpMax: 55
  tempHp: 0
abilities:
  str: 17
  dex: 14
  con: 17
  int: 8
  wis: 10
  cha: 8
savingThrows:
  - str
  - con
skills:
  perception: proficient
  survival: proficient
  athletics: proficient
  intimidation: proficient
  acrobatics: proficient
consumables:
  rage:
    label: Rage
    uses: 3
    usesMax: "{{ barbarianClassFeatures.rages[level] }}"
    replenishesOn:
      - type: shortRest
        amount: 1
      - type: longRest
  warriorOfTheGods:
    label: Warrior Of The Gods
    uses: 4
    usesMax: 4
    replenishesOn: longRest
  heroicInspiration:
    label: Heroic Inspiration
    uses: 1
    usesMax: 1
    replenishesOn: longRest
  luckyPoints:
    label: Lucky Points
    uses: 1
    usesMax: 1
    replenishesOn: longRest

```

```dnd-hp-tracker
```

```dnd-badges
badges:
  - label: Class
    value: 'Barbarian'
  - label: Subclass
    value: 'Path of the Zealot'
  - label: Race
    value: 'Human'
  - label: Level
    value: '{{ level }}'
  - label: Speed
    value: '{{ speed }}ft + {{ barbarian.extraSpeed }}ft fast movement'
  - label: Passive Perception
    value: '{{ 10 + skills.perception.modifier }}'
```

```dnd-ability-scores
```

```dnd-skills-table
```

```dnd-consumables
```

```dnd-buttons
buttons:
  - label: Spend rage ({{ consumables.rage.uses }} left)
    variant: red
    update:
      consumables.rage.uses: "{{ math.max(0, consumables.rage.uses - 1) }}"
```

```dnd-cards
cards:
  - label: Armor Class
    value: '{{ 10 + abilities.con.modifier + abilities.dex.modifier }}'
  - label: Initiative
    value: '{{ abilities.dex.modifier }}'
  - label: Attack roll (STR)
    value: '{{ math.format(abilities.str.modifier + pb) }}'
  - label: Attack roll (DEX)
    value: '{{ math.format(abilities.dex.modifier + pb) }}'
```

```dnd-cards
cards:
  - label: Mainhand
    value: '1d12 + {{ abilities.str.modifier }} slashing'
    offlabel: Greataxe
  - label: Offhand
    value: '1d6 + {{ abilities.str.modifier }} slashing'
    offlabel: Handaxes
  - label: Extra Dmg 1
    value: '+{{ pb }}'
    offlabel: 'Great Weapon Mastery'
  - label: Extra Dmg 2
    value: '{{ barbarian.rageDamage }}'
    offlabel: 'Rage'
  - label: Extra Dmg 3
    offlabel: 'Rage - first hit per turn'
    value: '1d6 + {{ math.floor(level / 2) }} necr/radnt'
```
````
