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
