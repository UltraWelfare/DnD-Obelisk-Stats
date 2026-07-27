Below is an example of calculating spell slots.
````

```dnd-character-stats
class: Wizard
pb: 2
level: 1
speed: 30
spellSlots:
  level1:
    "1": 2
  level2:
    "1": 3
  level3:
    "1": 4
    "2": 2
  level4:
    "1": 4
    "2": 3
  level5:
    "1": 4
    "2": 3
    "3": 2
  level6:
    "1": 4
    "2": 3
    "3": 3
  level7:
    "1": 4
    "2": 3
    "3": 3
    "4": 1
  level8:
    "1": 4
    "2": 3
    "3": 3
    "4": 2
  level9:
    "1": 4
    "2": 3
    "3": 3
    "4": 3
    "5": 1
  level10:
    "1": 4
    "2": 3
    "3": 3
    "4": 3
    "5": 2
  level11:
    "1": 4
    "2": 3
    "3": 3
    "4": 3
    "5": 2
    "6": 1
  level12:
    "1": 4
    "2": 3
    "3": 3
    "4": 3
    "5": 2
    "6": 1
health:
  hitDiceMax: 5
  hitDiceUsed: 0
  hp: 42
  hitDie: d12
  hpMax: 42
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
  lvl1SpellSlots:
    label: Level 1 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][1] ?? 0 }}"
    replenishesOn: longRest
  lvl2SpellSlots:
    label: Level 2 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][2] ?? 0 }}"
    replenishesOn: longRest
  lvl3SpellSlots:
    label: Level 3 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][3] ?? 0 }}"
    replenishesOn: longRest
  lvl4SpellSlots:
    label: Level 4 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][4] ?? 0 }}"
    replenishesOn: longRest
  lvl5SpellSlots:
    label: Level 5 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][5] ?? 0 }}"
    replenishesOn: longRest
  lvl6SpellSlots:
    label: Level 6 Spell Slots
    uses: 0
    usesMax: "{{ spellSlots['level' + level][6] ?? 0 }}"
    replenishesOn: longRest
```

```dnd-buttons
buttons:
  - label: "Reset Level"
    variant: "red"
    update:
      level: 1
  - label: "Level Up"
    variant: "green"
    update:
      level: '{{ level + 1 }}'
```

```dnd-consumables
```

````
