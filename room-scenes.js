'use strict';

const facilityLayout = [
  { x: -3.37, z: 0, w: 6.43, d: 8.55, color: 0x7b9ebc, clean: 0xbce9fa, floor: 'carpet' },
  { x: 3.37, z: -2.19, w: 6.43, d: 4.17, color: 0x7d9ab0, clean: 0xb5f1fa, floor: 'planks' },
  { x: 3.37, z: 2.19, w: 6.43, d: 4.17, color: 0x889fc2, clean: 0xc2e7ff, floor: 'tile' }
];

const roomDetails = {
  home: [
    { name: 'Office', tasks: ['Wipe desks and work surfaces', 'Clean door handles and switches', 'Empty wastebaskets', 'Vacuum the carpet'] },
    { name: 'Breakroom', tasks: ['Wipe tables and counters', 'Clean the sink', 'Empty trash and replace the liner', 'Mop the floor'] },
    { name: 'Restroom', tasks: ['Disinfect toilets and sinks', 'Wipe mirrors and touchpoints', 'Restock soap and paper products', 'Mop the floor'] }
  ],
  commercial: [
    { name: 'Office', tasks: ['Wipe desks and shared work surfaces', 'Disinfect high-touch points', 'Empty trash and replace liners', 'Vacuum carpet and entry mats'] },
    { name: 'Breakroom', tasks: ['Clean tables and counters', 'Scrub the sink and wipe the faucet', 'Wipe appliance handles', 'Empty trash and mop the floor'] },
    { name: 'Restroom', tasks: ['Disinfect toilets, sinks, and touchpoints', 'Clean mirrors and counters', 'Refill dispensers as agreed', 'Mop the floor'] }
  ],
  residential: [
    { name: 'Living room', color: 0xb29e87, floor: 'planks', tasks: ['Dust tables and reachable surfaces', 'Wipe frequently touched surfaces', 'Vacuum rugs', 'Clean hard floors'] },
    { name: 'Kitchen', color: 0xb9ac96, floor: 'planks', tasks: ['Wipe counters and appliance fronts', 'Scrub the sink and wipe the faucet', 'Clean the exterior of the stovetop', 'Sweep and mop the floor'] },
    { name: 'Bedroom', color: 0xb8a495, floor: 'carpet', tasks: ['Dust nightstands and dressers', 'Wipe reachable surfaces', 'Empty the wastebasket', 'Vacuum the floor'] }
  ]
};

function residentialFurniture({ block, cylinder, partition, glazing, chair, plant, basin, rounded, theme }) {
  function livingRoom(g) {
    glazing(g,-.15,-4.16,5.98);
    partition(g,-3.14,-2.38,.17,3.48,1.55);
    partition(g,3.13,2.82,.17,2.35,1.13);
    block(g,-.70,.026,.53,4.1,.05,4.5,theme.counter,false);
    block(g,-.95,.188,-1.33,3.45,.375,.97,theme.upholstery);
    block(g,-.95,.548,-1.77,3.45,.49,.23,theme.upholstery);
    for (const x of [-2.52,.62]) block(g,x,.455,-1.31,.25,.30,.96,theme.upholstery);
    for (const x of [-1.99,-.95,.09]) block(g,x,.42,-1.29,.94,.13,.77,theme.cabinet);
    const cushion = block(g,-1.55,.645,-1.56,.48,.44,.18,theme.wood);
    cushion.rotation.z=.18;
    block(g,-2.24,.192,.39,.86,.384,2.13,theme.upholstery);
    block(g,-2.24,.42,.37,.74,.12,2.02,theme.cabinet);
    cylinder(g,-.27,.53,.45,.64,.64,.12,theme.wood);
    cylinder(g,-.27,.265,.45,.115,.17,.51,theme.steel);
    block(g,-.19,.60,.44,.32,.033,.24,theme.white);
    chair(g,1.63,1.05,-Math.PI/2);
    block(g,-.81,.31,3.58,2.48,.59,.48,theme.wood);
    block(g,-.81,.91,3.72,1.88,.91,.062,theme.monitor);
    block(g,-.81,.91,3.68,1.73,.78,.018,theme.screen,false);
    plant(g,-2.65,-3.47,1.1);
    plant(g,2.62,3.43,.82);
  }
  function kitchen(g) {
    glazing(g,-.2,-2.02,5.94);
    partition(g,3.13,-1.15,.155,1.78,1.32);
    for(const x of [-2.15,-1.21,-.27,.67,1.61]){
      block(g,x,.38,-1.47,.925,.76,.67,theme.cabinet);
      block(g,x,.591,-1.12,.37,.033,.04,theme.steel);
    }
    block(g,-.29,.784,-1.47,4.73,.10,.725,theme.wood);
    basin(g,-1.24,.835,-1.53);
    block(g,1.54,.841,-1.48,.64,.018,.55,theme.black);
    for(const x of [1.42,1.66]) for(const z of [-1.58,-1.37]) cylinder(g,x,.854,z,.074,.074,.011,theme.steel);
    block(g,2.52,.84,-1.50,.81,1.67,.79,theme.cabinet);
    block(g,2.74,1.1,-1.08,.042,.24,.04,theme.steel);
    block(g,-.36,.44,.44,2.92,.81,.82,theme.cabinet);
    block(g,-.36,.874,.44,3.17,.091,1.1,theme.wood);
    chair(g,-1.10,1.47,0);
    chair(g,.32,1.47,0);
    cylinder(g,-.27,.98,.37,.14,.10,.16,theme.white);
  }
  function bedroom(g) {
    partition(g,-.12,-2.02,6.12,.16,1.42);
    partition(g,3.12,.85,.16,2.36,1.22);
    block(g,-.3,.23,-.33,2.48,.42,2.57,theme.wood);
    block(g,-.30,.47,-.27,2.40,.23,2.45,theme.white);
    block(g,-.30,.588,.14,2.33,.081,1.55,theme.upholstery);
    block(g,-.30,.632,.66,2.33,.055,.49,theme.counter);
    block(g,-.30,.70,-1.58,2.6,.98,.19,theme.wood);
    for (const x of [-.84,.24]) rounded(g,x,.65,-1.03,.43,.09,.22,theme.white);
    for (const x of [-2.04,1.42]) {
      block(g,x,.275,-1.11,.64,.54,.58,theme.cabinet);
      block(g,x,.556,-1.11,.67,.06,.62,theme.wood);
      cylinder(g,x,.62,-1.11,.105,.105,.075,theme.steel);
      cylinder(g,x,.78,-1.11,.15,.11,.24,theme.white);
    }
    block(g,2.28,.44,1.37,1.16,.86,.48,theme.cabinet);
    plant(g,-2.59,1.31,.88);
  }
  return [livingRoom, kitchen, bedroom];
}

// Mess shown in each room before it is cleaned, grouped by checklist task.
// Coordinates are local to the room. Types: paper, cup, stain, crumbs, trash, bin,
// smudge (vertical, facing +x/-x/+z/-z), dust, dishes, roll, soap. Items with
// appear:true show up when their task is checked (restocking) instead of vanishing.
const facilityMess = [
  [ // Office
    [ {t:'paper',x:-2.2,y:.80,z:-2.52,r:.4}, {t:'paper',x:-2.05,y:.81,z:-2.47,r:-.3}, {t:'cup',x:-1.15,y:.80,z:-2.48},
      {t:'paper',x:.68,y:.80,z:-2.5,r:.9}, {t:'stain',x:1.5,y:.80,z:-2.5,s:.12}, {t:'cup',x:1.62,y:.80,z:-2.82},
      {t:'paper',x:-1.85,y:.80,z:.55,r:1.3}, {t:'cup',x:-1.6,y:.80,z:-.42},
      {t:'paper',x:1.3,y:.80,z:-.05,r:.2}, {t:'stain',x:1.2,y:.80,z:.85,s:.11},
      {t:'cup',x:.25,y:.53,z:2.6}, {t:'paper',x:.9,y:.53,z:2.66,r:-.6} ],
    [ {t:'smudge',x:3.07,y:1.0,z:-1.4,f:'-x'}, {t:'smudge',x:3.07,y:.85,z:-1.62,f:'-x'},
      {t:'smudge',x:3.07,y:1.0,z:1.7,f:'-x'}, {t:'smudge',x:-3.05,y:1.0,z:-1.0,f:'x'},
      {t:'smudge',x:-1.2,y:1.15,z:-4.12,f:'z'}, {t:'smudge',x:1.6,y:1.0,z:-4.12,f:'z'} ],
    [ {t:'bin',x:-2.55,z:-1.95,keep:true}, {t:'trash',x:-2.55,z:-1.95,n:7},
      {t:'bin',x:2.35,z:1.0,keep:true}, {t:'trash',x:2.35,z:1.0,n:6} ],
    [ {t:'crumbs',x:-.3,z:-1.3,spread:1.5,n:26}, {t:'crumbs',x:.6,z:1.9,spread:1.2,n:18},
      {t:'crumbs',x:-2.2,z:3.4,spread:.8,n:12}, {t:'stain',x:-.9,y:.005,z:1.2,s:.24} ]
  ],
  [ // Breakroom
    [ {t:'stain',x:.3,y:.785,z:.25,s:.16}, {t:'crumbs',x:.0,z:.55,spread:.35,n:10,y:.78}, {t:'cup',x:-.3,y:.78,z:.6},
      {t:'cup',x:.5,y:.78,z:.15}, {t:'stain',x:-.75,y:.83,z:-1.45,s:.14}, {t:'crumbs',x:-.2,z:-1.4,spread:.4,n:9,y:.83} ],
    [ {t:'dishes',x:.2,y:.83,z:-1.42}, {t:'cup',x:.95,y:.83,z:-1.38}, {t:'stain',x:.55,y:.86,z:-1.48,s:.1} ],
    [ {t:'bin',x:-2.45,z:-.55,keep:true}, {t:'trash',x:-2.45,z:-.55,n:7} ],
    [ {t:'stain',x:-.9,y:.005,z:1.1,s:.3}, {t:'crumbs',x:.3,z:.5,spread:1.3,n:22}, {t:'stain',x:1.9,y:.005,z:.3,s:.2} ]
  ],
  [ // Restroom
    [ {t:'stain',x:.93,y:.475,z:-1.15,s:.08}, {t:'stain',x:2.28,y:.475,z:-1.15,s:.08},
      {t:'stain',x:-2.23,y:1.03,z:-1.45,s:.07}, {t:'stain',x:-1.22,y:1.03,z:-1.45,s:.07},
      {t:'stain',x:-1.75,y:.96,z:-1.3,s:.1} ],
    [ {t:'smudge',x:-2.2,y:1.35,z:-1.85,f:'z'}, {t:'smudge',x:-1.4,y:1.22,z:-1.85,f:'z'},
      {t:'smudge',x:-1.0,y:1.42,z:-1.85,f:'z'}, {t:'smudge',x:1.42,y:.85,z:.29,f:'z'}, {t:'smudge',x:2.92,y:.85,z:.29,f:'z'} ],
    [ {t:'roll',x:.62,y:.06,z:-1.3,appear:true}, {t:'roll',x:1.97,y:.06,z:-1.3,appear:true},
      {t:'soap',x:-2.6,y:.96,z:-1.62,appear:true}, {t:'soap',x:-.85,y:.96,z:-1.62,appear:true} ],
    [ {t:'paper',x:1.2,y:.01,z:-.3,r:.5}, {t:'paper',x:-.5,y:.01,z:.6,r:1.2}, {t:'stain',x:-1.4,y:.005,z:-.6,s:.26},
      {t:'crumbs',x:-.4,z:1.1,spread:1.3,n:18}, {t:'stain',x:.6,y:.005,z:1.4,s:.18} ]
  ]
];

const roomMess = {
  home: facilityMess,
  commercial: [
    facilityMess[0],
    [ facilityMess[1][0], facilityMess[1][1],
      [ {t:'smudge',x:2.28,y:1.15,z:-1.11,f:'z'}, {t:'smudge',x:2.45,y:.6,z:-1.11,f:'z'}, {t:'smudge',x:-1.42,y:1.0,z:-1.27,f:'z'} ],
      [ ...facilityMess[1][2], ...facilityMess[1][3] ] ],
    facilityMess[2]
  ],
  residential: [
    [ // Living room
      [ {t:'dust',x:-.27,y:.595,z:.45,s:.5}, {t:'dust',x:-.81,y:.61,z:3.5,s:.6}, {t:'dust',x:-2.24,y:.485,z:.9,s:.35}, {t:'cup',x:-.45,y:.59,z:.25} ],
      [ {t:'smudge',x:-1.2,y:.95,z:3.665,f:'-z'}, {t:'smudge',x:-.45,y:.8,z:3.665,f:'-z'}, {t:'stain',x:-.05,y:.595,z:.6,s:.1}, {t:'smudge',x:3.04,y:.95,z:1.9,f:'-x'} ],
      [ {t:'crumbs',x:-.6,z:.4,spread:1.6,n:26,y:.055}, {t:'paper',x:.6,y:.055,z:1.6,r:.7} ],
      [ {t:'crumbs',x:1.9,z:-2.6,spread:.9,n:14}, {t:'stain',x:2.1,y:.005,z:2.0,s:.24}, {t:'crumbs',x:-2.5,z:3.0,spread:.6,n:10}, {t:'stain',x:1.7,y:.005,z:-.6,s:.16} ]
    ],
    [ // Kitchen
      [ {t:'crumbs',x:-.6,z:.45,spread:.8,n:16,y:.92}, {t:'stain',x:.4,y:.92,z:.3,s:.15}, {t:'stain',x:-.4,y:.835,z:-1.42,s:.13}, {t:'smudge',x:2.4,y:1.1,z:-1.09,f:'z'} ],
      [ {t:'dishes',x:-1.7,y:.835,z:-1.42}, {t:'cup',x:-.8,y:.835,z:-1.4}, {t:'stain',x:-1.24,y:.87,z:-1.53,s:.1} ],
      [ {t:'stain',x:1.42,y:.852,z:-1.37,s:.07}, {t:'stain',x:1.66,y:.852,z:-1.58,s:.08}, {t:'stain',x:1.55,y:.852,z:-1.48,s:.06} ],
      [ {t:'crumbs',x:-.3,z:1.2,spread:1.4,n:22}, {t:'stain',x:1.3,y:.005,z:-.6,s:.22}, {t:'stain',x:-2.2,y:.005,z:.9,s:.18} ]
    ],
    [ // Bedroom
      [ {t:'dust',x:-2.04,y:.59,z:-1.0,s:.28}, {t:'dust',x:1.42,y:.59,z:-1.0,s:.28}, {t:'dust',x:2.28,y:.875,z:1.37,s:.5} ],
      [ {t:'smudge',x:-.8,y:.95,z:-1.48,f:'z'}, {t:'smudge',x:.3,y:1.0,z:-1.48,f:'z'}, {t:'smudge',x:3.03,y:.9,z:.5,f:'-x'} ],
      [ {t:'bin',x:1.35,z:1.55,keep:true}, {t:'trash',x:1.35,z:1.55,n:6} ],
      [ {t:'crumbs',x:-.3,z:1.4,spread:1.5,n:22}, {t:'crumbs',x:2.2,z:-.5,spread:.6,n:10}, {t:'paper',x:-2.1,y:.01,z:.4,r:.8} ]
    ]
  ]
};
