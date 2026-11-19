'use strict';

const sceneName = document.querySelector('.experience').dataset.scene || 'home';
const isResidential = sceneName === 'residential';
const rooms = facilityLayout.map((layout, index) => ({ ...layout, ...roomDetails[sceneName][index] }));

const sceneElement = document.querySelector('#scene');
const hotspots = [...document.querySelectorAll('[data-room]')];
const stepButtons = [...document.querySelectorAll('[data-step]')];
const viewButtons = [...document.querySelectorAll('[data-view]')];
const progress = document.querySelector('#progress');
const jobHeading = document.querySelector('#job-heading');
const jobTasks = document.querySelector('#job-tasks');
const jobCount = document.querySelector('#job-count');
const demoAction = document.querySelector('#demo-action');
const actionLabel = demoAction.querySelector('span');
const resetCamera = document.querySelector('.reset-camera');
const viewHint = document.querySelector('#view-hint');
let selection = -1;
let autoTimer = 0;
let renderedRoom = -1;
const roomChecks = rooms.map(() => new Set());
let model;

function isComplete(index) {
  return roomChecks[index].size === rooms[index].tasks.length;
}

function renderChecklist(index) {
  const room = rooms[index];
  const checks = roomChecks[index];
  if (renderedRoom !== index) {
    jobHeading.textContent = room.name + ' checklist';
    const items = room.tasks.map((task, taskIndex) => {
      const item = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      const text = document.createElement('span');

      input.type = 'checkbox';
      input.dataset.task = String(taskIndex);
      text.textContent = task;
      label.append(input, text);
      item.append(label);
      return item;
    });
    jobTasks.replaceChildren(...items);
    renderedRoom = index;
  }
  jobTasks.querySelectorAll('input').forEach(input => {
    input.checked = checks.has(Number(input.dataset.task));
  });
  const tally = checks.size + ' / ' + room.tasks.length + ' TASKS';
  if (jobCount.textContent !== tally) jobCount.textContent = tally;
}

function updateControls() {
  const complete = new Set([...rooms.keys()].filter(isComplete));
  const count = complete.size;
  const tally = count + ' / ' + rooms.length + ' COMPLETE';
  if (progress.textContent !== tally) progress.textContent = tally;
  [...hotspots, ...stepButtons].forEach(button => {
    const index = Number(button.dataset.room ?? button.dataset.step);
    const active = index === selection;
    const done = complete.has(index);
    button.classList.toggle('active', active);
    button.classList.toggle('finished', done);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', rooms[index].name + (done ? ', completed' : ''));
  });
  renderChecklist(selection < 0 ? 0 : selection);

  if (count === rooms.length) actionLabel.textContent = 'Replay walkthrough';
  else if (selection < 0) actionLabel.textContent = 'Start walkthrough';
  else if (complete.has(selection)) actionLabel.textContent = 'Next room';
  else actionLabel.textContent = 'Show finished room';

  demoAction.classList.toggle('invite', selection < 0 && count === 0);
  demoAction.disabled = autoTimer !== 0;
  if (autoTimer) actionLabel.textContent = 'Cleaning…';
  model.update(selection, complete, roomChecks);
}

function stopAutoClean() {
  clearTimeout(autoTimer);
  autoTimer = 0;
}

function selectRoom(index) {
  stopAutoClean();
  hideFinale();
  selection = index;
  updateControls();
}

const finale = document.createElement('div');
finale.className = 'finale';
finale.hidden = true;
finale.setAttribute('role', 'status');
finale.innerHTML = '<p class="finale-kicker"><i aria-hidden="true">✓</i> ALL ROOMS COMPLETE</p>' +
  '<h2>Spotless, room by room.</h2>' +
  '<p>Want your ' + (isResidential ? 'home' : 'space') + ' cleaned like this?</p>' +
  '<div class="finale-actions"><a class="finale-cta" href="/request/">Request a walkthrough <i class="arrow" aria-hidden="true"></i></a>' +
  '<button type="button" class="finale-replay">Replay</button></div>';
document.querySelector('#viewer').append(finale);
let finaleTimer = 0;

function hideFinale() {
  clearTimeout(finaleTimer);
  finale.classList.remove('show');
  finale.hidden = true;
}

function roomFinished(index) {
  model.finish(index);
  if (!rooms.every((_, room) => isComplete(room))) return;
  stopAutoClean();
  finaleTimer = setTimeout(() => {
    selection = -1;
    updateControls();
    model.celebrate();
    finale.hidden = false;
    requestAnimationFrame(() => finale.classList.add('show'));
  }, 900);
}

function replay() {
  hideFinale();
  roomChecks.forEach(checks => checks.clear());
  selectRoom(-1);
  model.reset();
}

function autoClean(index) {
  const remaining = rooms[index].tasks.map((_, task) => task).filter(task => !roomChecks[index].has(task));
  const next = () => {
    const task = remaining.shift();
    roomChecks[index].add(task);
    autoTimer = remaining.length ? setTimeout(next, 520) : 0;
    if (isComplete(index)) roomFinished(index);
    updateControls();
  };
  autoTimer = -1;
  next();
}

function fallbackModel() {
  sceneElement.replaceChildren();
  const layout = document.createElement('div');
  layout.className = 'model-fallback';
  const cells = rooms.map(room => {
    const cell = document.createElement('div');
    cell.className = 'plan-room';
    cell.textContent = room.name;
    layout.append(cell);
    return cell;
  });
  sceneElement.append(layout);
  hotspots.forEach(button => { button.hidden = true; });
  viewButtons[0].closest('.view-controls').hidden = true;
  resetCamera.hidden = true;
  viewHint.textContent = 'Choose a room';
  return {
    update(active, finished) {
      cells.forEach((cell, index) => {
        cell.classList.toggle('active', active === index);
        cell.classList.toggle('finished', finished.has(index));
      });
    },
    finish() {},
    celebrate() {},
    changeView() {},
    reset() {}
  };
}

function buildModel() {
  const T = window.THREE;
  const canvas = document.querySelector('#model');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
  const renderer = gl ? new T.WebGLRenderer({canvas, context:gl, alpha:true, antialias:true}) : createCanvasRenderer(T,canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.55));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-10, 10, 8, -8, 0.1, 120);
  const facility = new T.Group();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  scene.add(facility, new T.HemisphereLight(0xd9edff, 0x4d547d, 2.15));
  const key = new T.DirectionalLight(0xe4f5ff, 2.15);
  key.position.set(-7, 15, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left:-10, right:10, top:9, bottom:-9, near:1, far:37 });
  key.shadow.bias = -0.00026;
  key.shadow.normalBias = 0.022;
  scene.add(key, key.target);
  const rim = new T.DirectionalLight(0x7bd4ff, 1.05);
  rim.position.set(7, 6, -9);
  scene.add(rim);

  const mat = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness:0.75, ...extra });
  const theme = {
    base:mat(0x132d54), trim:mat(0x354f77), edge:mat(0x75c7e9,{emissive:0x0d5674,emissiveIntensity:.45}),
    wall:mat(0xc6deef), wallEdge:mat(0xe7f4fa), wallCap:mat(0x7895b6), cabinet:mat(0xc7d8e5),
    upholstery:mat(0x234264), navy:mat(0x254061), steel:mat(0x718ca8,{metalness:.3,roughness:.42}),
    white:mat(0xf5fafc,{roughness:.43}), wood:mat(0xb39473), counter:mat(0x9db3c7),
    black:mat(0x13223b), monitor:mat(0x313c56), screen:mat(0x3885ae,{emissive:0x17486e,emissiveIntensity:.65}),
    glass:mat(0x9bdcff,{transparent:true,opacity:.32,roughness:.22,depthWrite:false}),
    mirror:mat(0x9fb9d8,{metalness:.45,roughness:.2}), green:mat(0x3d8e86), leaf:mat(0x5bafa2)
  };
  const cube = new T.BoxGeometry(1,1,1);
  const cylinders = new Map();
  const spheres = new T.SphereGeometry(1, 12, 8);
  function block(parent, x, y, z, w, h, d, material, shadow = true) {
    const object = new T.Mesh(cube, material);
    object.scale.set(w,h,d);
    object.position.set(x,y,z);
    object.castShadow = shadow;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function cylinder(parent, x, y, z, top, bottom, height, material) {
    const id = [top,bottom,height].join('/');
    if (!cylinders.has(id)) cylinders.set(id, new T.CylinderGeometry(top,bottom,height,18));
    const mesh = new T.Mesh(cylinders.get(id), material);
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function rounded(parent, x, y, z, sx, sy, sz, material) {
    const mesh = new T.Mesh(spheres, material);
    mesh.position.set(x,y,z);
    mesh.scale.set(sx,sy,sz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function group(parent,x=0,y=0,z=0,rotation=0) {
    const g = new T.Group();
    g.position.set(x,y,z);
    g.rotation.y = rotation;
    parent.add(g);
    return g;
  }

  block(facility,0,-.59,0,13.83,.37,9.0,theme.base).userData.foundation=true;
  block(facility,0,-.38,0,14.01,.08,9.18,theme.edge,false).userData.foundation=true;
  block(facility,0,-.25,0,13.77,.26,8.98,theme.trim).userData.foundation=true;
  const grid = new T.GridHelper(54,54,0x355b8a,0x274466);
  grid.position.y = -.99;
  grid.material.transparent = true;
  grid.material.opacity = .48;
  scene.add(grid);
  const ground = new T.Mesh(new T.PlaneGeometry(80,80), new T.ShadowMaterial({opacity:.24}));
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -.96;
  ground.receiveShadow = true;
  scene.add(ground);

  function floorTexture(style) {
    const surface = document.createElement('canvas');
    surface.width = 512;
    surface.height = 512;
    const ctx = surface.getContext('2d');
    let seed = 285 + style.length;
    function random() {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    ctx.fillStyle = '#e3e8eb';
    ctx.fillRect(0,0,512,512);
    const stepX = style === 'planks' ? 34 : style === 'tile' ? 72 : 128;
    const stepY = style === 'planks' ? 170 : style === 'tile' ? 72 : 128;
    for (let x=0;x<512;x+=stepX) {
      const offset = style === 'planks' ? Math.round(random()*stepY) : 0;
      for (let y=-offset;y<512;y+=stepY) {
        ctx.fillStyle = 'rgba(58,79,91,' + (.04 + random()*.13) + ')';
        ctx.fillRect(x,y,stepX-1,stepY-1);
      }
    }
    for (let i=0;i<4700;i++) {
      ctx.fillStyle = random() < .5 ? '#5f78851b' : '#ffffff60';
      ctx.fillRect(random()*512,random()*512,style==='planks'?1:2,style==='planks'?8:2);
    }
    const texture = new T.CanvasTexture(surface);
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  }

  function partition(parent,x,z,w,d,height=1.72) {
    block(parent,x,height/2,z,w,height,d,theme.wall);
    block(parent,x,height+.015,z,w+.018,.053,d+.018,theme.wallEdge);
    block(parent,x,.075,z,w+.013,.13,d+.013,theme.wallCap);
  }
  function glazing(parent, x, z, w) {
    partition(parent,x,z,w,.17,.57);
    block(parent,x,1.12,z,w,.05,.11,theme.wallCap);
    block(parent,x,1.69,z,w,.07,.13,theme.wallEdge);
    block(parent,x,1.125,z,w-.08,1.06,.035,theme.glass,false);
    for(let a=-1;a<=1;a++) block(parent,x+a*w*.33,1.12,z,.065,1.1,.11,theme.wallEdge);
  }
  function chair(parent,x,z,rotation=0) {
    const g = group(parent,x,0,z,rotation);
    cylinder(g,0,.16,0,.055,.068,.28,theme.steel);
    block(g,0,.068,0,.49,.055,.075,theme.black);
    block(g,0,.068,0,.075,.055,.49,theme.black);
    block(g,0,.34,0,.51,.115,.49,theme.upholstery);
    block(g,0,.61,-.22,.49,.42,.092,theme.upholstery);
    return g;
  }
  function plant(parent,x,z,scale=1) {
    const g=group(parent,x,0,z);
    g.scale.setScalar(scale);
    cylinder(g,0,.2,0,.23,.17,.38,theme.white);
    cylinder(g,0,.4,0,.203,.203,.04,theme.black);
    cylinder(g,0,.64,0,.023,.035,.5,theme.green);
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      rounded(g,Math.cos(a)*.16,.62+i*.044,Math.sin(a)*.16,.22,.078,.103,i%2?theme.leaf:theme.green).rotation.y=-a;
    }
    rounded(g,0,.99,0,.10,.18,.10,theme.leaf);
  }
  function workstation(parent,x,z,rotation=0) {
    const g=group(parent,x,0,z,rotation);
    block(g,0,.74,0,1.64,.105,.76,theme.wood);
    block(g,-.64,.34,0,.06,.68,.64,theme.steel);
    block(g,.60,.35,0,.33,.67,.63,theme.cabinet);
    for(const y of [.29,.49]) block(g,.60,y,.324,.14,.030,.035,theme.steel);
    block(g,0,.82,-.135,.28,.038,.19,theme.black);
    block(g,0,.92,-.16,.043,.22,.055,theme.black);
    block(g,0,1.1,-.164,.59,.375,.067,theme.monitor);
    block(g,0,1.1,-.125,.535,.319,.011,theme.screen,false);
    block(g,0,.807,.13,.39,.024,.13,theme.white);
    block(g,.30,.812,.13,.075,.028,.11,theme.navy);
    chair(g,0,.77,Math.PI);
  }
  function basin(parent,x,y,z,scale=1) {
    const g=group(parent,x,y,z);
    g.scale.setScalar(scale);
    rounded(g,0,.026,0,.28,.09,.221,theme.white);
    rounded(g,0,.072,-.007,.218,.028,.169,theme.steel);
    rounded(g,0,.075,-.007,.169,.014,.122,theme.white);
    cylinder(g,0,.084,-.015,.029,.029,.012,theme.steel);
    cylinder(g,0,.14,-.18,.026,.028,.18,theme.steel);
    block(g,0,.225,-.115,.052,.048,.14,theme.steel);
  }
  function toilet(parent,x,z) {
    const g=group(parent,x,0,z,Math.PI);
    cylinder(g,0,.17,0,.177,.143,.33,theme.white);
    rounded(g,0,.35,.066,.223,.136,.309,theme.white);
    rounded(g,0,.449,.082,.166,.035,.239,theme.steel);
    rounded(g,0,.469,.082,.123,.011,.177,theme.white);
    block(g,0,.55,-.25,.39,.42,.205,theme.white);
    block(g,0,.772,-.25,.43,.047,.23,theme.wallEdge);
  }
  function office(g) {
    glazing(g,-.18,-4.17,5.97);
    partition(g,-3.14,-2.48,.17,3.42);
    partition(g,3.16,-2.64,.16,3.06,1.25);
    partition(g,3.16,2.83,.16,2.69,1.23);
    workstation(g,-1.71,-2.7);
    workstation(g,1.13,-2.7);
    workstation(g,-1.77,.03,Math.PI/2);
    workstation(g,1.27,.39,-Math.PI/2);
    block(g,-2.79,.36,2.7,.55,.72,1.69,theme.cabinet);
    block(g,-2.78,.74,2.7,.62,.056,1.72,theme.wood);
    block(g,.55,.49,2.64,1.7,.07,.43,theme.wood);
    for(const x of [-.19,1.30]) block(g,x,.23,2.64,.06,.46,.38,theme.steel);
    block(g,.42,.19,3.47,1.78,.38,.61,theme.upholstery);
    block(g,.42,.51,3.7,1.78,.37,.17,theme.upholstery);
    plant(g,-2.7,-3.65,.85);
    plant(g,2.56,3.55,1.02);
  }
  function breakroom(g) {
    glazing(g,-.18,-2.01,5.99);
    partition(g,3.13,-1.07,.15,1.88,1.28);
    partition(g,1.13,2.03,3.99,.16,1.18);
    for(const x of [-1.48,-.65,.18,1.02]) {
      block(g,x,.38,-1.48,.8,.76,.67,theme.cabinet);
      block(g,x,.53,-1.123,.34,.039,.046,theme.steel);
    }
    block(g,-.21,.783,-1.48,3.41,.088,.72,theme.wood);
    basin(g,.55,.831,-1.48,1);
    block(g,2.28,.84,-1.54,.84,1.67,.73,theme.steel);
    block(g,2.28,.48,-1.148,.875,.83,.061,theme.cabinet);
    block(g,2.28,1.28,-1.148,.875,.70,.061,theme.cabinet);
    block(g,2.52,1.1,-1.099,.039,.25,.04,theme.navy);
    block(g,-1.41,.982,-1.47,.44,.31,.35,theme.black);
    block(g,-1.45,.99,-1.285,.29,.19,.019,theme.screen,false);
    cylinder(g,.11,.72,.43,.86,.86,.104,theme.wood);
    cylinder(g,.11,.35,.43,.087,.13,.65,theme.steel);
    cylinder(g,.11,.058,.43,.44,.44,.05,theme.steel);
    chair(g,-1.05,.42,Math.PI/2);
    chair(g,1.28,.42,-Math.PI/2);
    chair(g,.11,1.54,0);
    plant(g,-2.51,1.32,.78);
  }
  function restroom(g) {
    partition(g,-1.85,-2.01,2.50,.16,1.64);
    partition(g,1.74,-2.01,2.76,.16,1.61);
    partition(g,3.11,-.54,.16,2.76,1.58);
    partition(g,1.59,-.81,.1,2.03,1.22);
    partition(g,.23,-.81,.1,2.03,1.22);
    block(g,2.65,.8,.24,.81,1.19,.078,theme.wallCap);
    block(g,1.14,.8,.24,.81,1.19,.078,theme.wallCap);
    block(g,1.42,.832,.192,.08,.045,.037,theme.steel);
    block(g,2.92,.832,.192,.08,.045,.037,theme.steel);
    toilet(g,.93,-1.06);
    toilet(g,2.28,-1.06);
    block(g,-1.72,.44,-1.47,2.10,.87,.68,theme.cabinet);
    block(g,-1.72,.91,-1.47,2.22,.09,.72,theme.counter);
    basin(g,-2.23,.95,-1.44,.92);
    basin(g,-1.22,.95,-1.44,.92);
    block(g,-1.73,1.29,-1.904,2.11,.60,.055,theme.wallEdge);
    block(g,-1.73,1.29,-1.866,2.02,.51,.013,theme.mirror,false);
    cylinder(g,-2.51,.20,.32,.19,.16,.4,theme.steel);
    block(g,-2.69,.021,1.42,1.01,.034,.5,theme.navy,false);
  }

  const messMat = {
    paper:mat(0xf3f1e8,{roughness:.9}), cup:mat(0xf7f3ea,{roughness:.5}), coffee:mat(0x6b4a2b),
    stain:new T.MeshStandardMaterial({color:0x6b5434,transparent:true,opacity:.6,roughness:1,depthWrite:false}),
    crumb:mat(0x5b4a36), trash:mat(0xe1ddd2,{roughness:1}), trash2:mat(0xa3b3c4,{roughness:1}),
    smudge:new T.MeshStandardMaterial({color:0x5a5040,transparent:true,opacity:.45,roughness:1,depthWrite:false}),
    dust:new T.MeshStandardMaterial({color:0x99958a,transparent:true,opacity:.7,roughness:1,depthWrite:false}),
    bin:mat(0x4f6b8c,{metalness:.25,roughness:.5}), soap:mat(0x5fc3d8,{roughness:.35})
  };
  const disc = new T.CylinderGeometry(1,1,1,20);
  let messSeed = 543;
  const rand = () => { messSeed = (Math.imul(messSeed,1664525) + 1013904223) >>> 0; return messSeed / 4294967296; };
  function flat(parent, material, sx, sz, y = .004) {
    const mesh = new T.Mesh(disc, material);
    mesh.scale.set(sx, .004, sz);
    mesh.position.y = y;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function messItem(parent, item) {
    const g = group(parent, item.x, item.y ?? 0, item.z);
    switch (item.t) {
      case 'paper':
        g.rotation.y = item.r || 0;
        block(g,0,.006,0,.3,.012,.22,messMat.paper,false);
        block(g,.035,.015,.025,.27,.006,.2,messMat.paper,false).rotation.y = .3;
        break;
      case 'cup':
        cylinder(g,0,.07,0,.05,.04,.14,messMat.cup);
        cylinder(g,0,.141,0,.043,.043,.004,messMat.coffee);
        break;
      case 'stain': flat(g, messMat.stain, item.s, item.s * .78); break;
      case 'dust': flat(g, messMat.dust, item.s, item.s * .7); break;
      case 'crumbs':
        for (let i = 0; i < item.n; i++) {
          const a = rand() * 6.283, r = Math.sqrt(rand()) * item.spread;
          block(g,Math.cos(a)*r,.012,Math.sin(a)*r*.8,.03+rand()*.045,.02,.03+rand()*.045,messMat.crumb,false).rotation.y = rand()*3;
        }
        break;
      case 'trash':
        for (let i = 0; i < item.n; i++) {
          const a = rand() * 6.283, inside = i < 3, r = inside ? rand() * .1 : .24 + rand() * .22;
          rounded(g,Math.cos(a)*r,inside ? .47 + i * .06 : .06,Math.sin(a)*r,.07+rand()*.04,.06+rand()*.03,.07+rand()*.04,i % 3 ? messMat.trash : messMat.trash2);
        }
        break;
      case 'bin':
        cylinder(g,0,.22,0,.19,.15,.44,messMat.bin);
        cylinder(g,0,.443,0,.165,.165,.008,theme.black);
        break;
      case 'smudge':
        for (let i = 0; i < 3; i++) {
          const s = flat(g, messMat.smudge, .06 + rand() * .05, .08 + rand() * .05, (rand() - .5) * .22);
          const offset = (rand() - .5) * .26;
          if (item.f.endsWith('x')) { s.rotation.z = Math.PI / 2; s.position.z = offset; }
          else { s.rotation.x = Math.PI / 2; s.position.x = offset; }
        }
        break;
      case 'dishes':
        for (let i = 0; i < 4; i++) cylinder(g,(i % 2) * .02,.015 + i * .03,0,.15,.11,.025,theme.white);
        cylinder(g,.27,.06,.06,.05,.04,.12,messMat.cup);
        break;
      case 'roll':
        cylinder(g,0,.06,0,.065,.065,.12,theme.white);
        cylinder(g,.15,.06,.05,.065,.065,.12,theme.white);
        break;
      case 'soap':
        cylinder(g,0,.09,0,.045,.05,.18,messMat.soap);
        cylinder(g,0,.2,0,.012,.012,.05,theme.white);
        break;
    }
    return g;
  }
  function ownMaterials(g, skip) {
    const copies = new Map();
    g.traverse(object => {
      if (!object.isMesh || !object.material.isMeshStandardMaterial || object.material === skip) return;
      if (!copies.has(object.material)) {
        const copy = object.material.clone();
        copy.userData.base = copy.color.clone();
        copies.set(object.material, copy);
      }
      object.material = copies.get(object.material);
    });
    return [...copies.values()];
  }

  const sparkTexture = (() => {
    const surface = document.createElement('canvas');
    surface.width = surface.height = 64;
    const ctx = surface.getContext('2d');
    const glow = ctx.createRadialGradient(32,32,0,32,32,32);
    glow.addColorStop(0,'rgba(255,255,255,1)');
    glow.addColorStop(.3,'rgba(200,244,255,.9)');
    glow.addColorStop(1,'rgba(120,210,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = i % 2 ? 6 : 32;
      ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    const texture = new T.CanvasTexture(surface);
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  })();
  const sparkles = [];
  function sparkle(position, count = 4, spread = .22, delay = 0) {
    if (reducedMotion.matches) return;
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const sprite = new T.Sprite(new T.SpriteMaterial({map:sparkTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
      sprite.position.set(position.x + (Math.random() - .5) * spread * 2, position.y + .1 + Math.random() * .25, position.z + (Math.random() - .5) * spread * 2);
      sprite.scale.setScalar(.001);
      sprite.userData = {born:now + delay + i * 75, life:650 + Math.random() * 450, size:.32 + Math.random() * .22, rise:.3 + Math.random() * .35, y:sprite.position.y};
      scene.add(sprite);
      sparkles.push(sprite);
    }
  }

  const buildFurniture = isResidential
    ? residentialFurniture({ block, cylinder, partition, glazing, chair, plant, basin, rounded, theme })
    : [office, breakroom, restroom];
  const models = rooms.map((room,index) => {
    const g=group(facility,room.x,0,room.z);
    const initial = new T.Color(room.color);
    const cleaned = new T.Color(room.clean);
    const top = mat(room.color,{map:floorTexture(room.floor),roughness:.83});
    block(g,0,-.104,0,room.w,.18,room.d,theme.base).userData.foundation=true;
    block(g,0,-.021,0,room.w,.04,room.d,top,false).userData.foundation=true;
    const outline = new T.LineSegments(
      new T.EdgesGeometry(new T.BoxGeometry(room.w+.037,.026,room.d+.037)),
      new T.LineBasicMaterial({color:0x8ce5ff,transparent:true,opacity:0})
    );
    outline.position.y=.019;
    outline.userData.outline=true;
    outline.userData.dimensions=[room.w+.037,room.d+.037];
    g.add(outline);
    const sweepMaterial = new T.ShaderMaterial({
      transparent:true, depthWrite:false,
      uniforms:{position:{value:-1}, alpha:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv;uniform float alpha;uniform float position;void main(){float a=abs(vUv.x-position);float edge=1.-smoothstep(.008,.026,a);float glow=1.-smoothstep(.015,.19,a);gl_FragColor=vec4(.49,.94,1.,(edge*.84+glow*.32)*alpha);}'
    });
    const sweepSurface = new T.Mesh(new T.PlaneGeometry(room.w-.09,room.d-.09),sweepMaterial);
    sweepSurface.rotation.x=-Math.PI/2;
    sweepSurface.position.y=.026;
    sweepSurface.userData.foundation=true;
    g.add(sweepSurface);
    buildFurniture[index](g);
    const mess = [];
    (roomMess[sceneName][index] || []).forEach((items, task) => {
      items.forEach((item, order) => {
        const object = messItem(g, item);
        mess.push({object, task, order, keep:!!item.keep, appear:!!item.appear, amount:0, target:0, startAt:0, sparked:true});
        if (item.appear) object.visible = false;
      });
    });
    const materials = ownMaterials(g, top);
    return {g,top,initial,cleaned,outline,sweepMaterial,mess,materials,finish:-1,amount:0,target:0,dim:0,selected:false,complete:false};
  });

  const originTheta = isResidential ? -.35 : .43;
  const originElevation=.66;
  let theta=originTheta, elevation=originElevation, targetTheta=theta, targetElevation=elevation;
  let lastOrbit=theta;
  let currentView='orbit';
  let width=1, height=1, frame=0, last=0, active=-1, drag;
  const point=new T.Vector3();
  const look=new T.Vector3(0,.14,0);
  const lookTarget=new T.Vector3(0,.14,0);
  const dimColor=new T.Color(0x0a1938);
  const worldPoint=new T.Vector3();
  let targetZoom=1;
  let idle=!reducedMotion.matches, onScreen=true;
  const idleUntil=performance.now()+25000;
  new IntersectionObserver(entries => {
    onScreen = entries[0].isIntersecting;
    if (onScreen) schedule();
  }).observe(sceneElement);
  const clamp=T.MathUtils.clamp;
  function moveCamera() {
    const distance=27;
    camera.position.set(distance*Math.cos(elevation)*Math.sin(theta),distance*Math.sin(elevation),distance*Math.cos(elevation)*Math.cos(theta));
    camera.lookAt(look);
    camera.updateMatrixWorld();
  }

  function placeMarkers() {
    const isPhone=width < 490;
    models.forEach((m,index) => {
      const room = rooms[index];
      point.set(room.x, (currentView==='plan'?0:1.26)+m.g.position.y, room.z).project(camera);
      let x=clamp((point.x*.5+.5)*width,isPhone?50:59,width-(isPhone?50:59));
      let y=clamp((.5-point.y*.5)*height,60,height-53);
      hotspots[index].style.left=x+'px';
      hotspots[index].style.top=y+'px';
      hotspots[index].style.zIndex=String((index===active?50:0)+Math.round(y));
      hotspots[index].classList.toggle('muted',active>=0 && index!==active);
      hotspots[index].hidden=false;
    });
  }
  function draw(time) {
    frame=0;
    const dt=last ? Math.min(time-last,36):16;
    last=time;
    const blend=reducedMotion.matches?1:1-Math.pow(.81,dt/16);
    if (idle && time > idleUntil) { idle = false; lastOrbit = targetTheta; }
    if (idle && onScreen && active < 0 && currentView==='orbit') targetTheta = lastOrbit + Math.sin(time / 2400) * .13;
    theta+=(targetTheta-theta)*blend;
    elevation+=(targetElevation-elevation)*blend;
    let moving=Math.abs(targetTheta-theta)+Math.abs(targetElevation-elevation)>.0009;
    const glide=reducedMotion.matches?1:1-Math.pow(.88,dt/16);
    look.lerp(lookTarget,glide);
    camera.zoom+=(targetZoom-camera.zoom)*glide;
    camera.updateProjectionMatrix();
    moving ||= look.distanceTo(lookTarget)+Math.abs(targetZoom-camera.zoom)>.001;
    for(const m of models) {
      const y=m.selected && currentView==='orbit'?.33:0;
      m.g.position.y+=(y-m.g.position.y)*blend;
      m.amount+=(m.target-m.amount)*blend*.53;
      if (reducedMotion.matches) m.amount=m.target;
      const dimTarget=active>=0 && !m.selected?1:0;
      m.dim+=(dimTarget-m.dim)*(reducedMotion.matches?1:blend*.7);
      const shade=m.dim*.62;
      m.top.color.copy(m.initial).lerp(m.cleaned,m.amount).lerp(dimColor,shade);
      m.top.roughness=.83-m.amount*.41;
      for (const material of m.materials) material.color.copy(material.userData.base).lerp(dimColor,shade);
      m.outline.material.color.setHex(m.complete?0x8ff0dc:0x8ce5ff);
      m.outline.material.opacity=m.selected?.91:m.complete?.6*(1-m.dim*.5):0;
      moving ||= Math.abs(dimTarget-m.dim)>.002;
      for (const item of m.mess) {
        if (item.keep) continue;
        if (time >= item.startAt) {
          if (!item.sparked) {
            item.sparked = true;
            item.object.getWorldPosition(worldPoint);
            sparkle(worldPoint, item.appear ? 3 : 4);
          }
          const step = reducedMotion.matches ? 1 : dt / 430;
          item.amount = item.target > item.amount ? Math.min(item.target, item.amount + step) : Math.max(item.target, item.amount - step);
        }
        const ease = item.amount * item.amount * (3 - 2 * item.amount);
        const visibleAmount = item.appear ? ease : 1 - ease;
        item.object.visible = visibleAmount > .01;
        item.object.scale.setScalar(Math.max(visibleAmount, .001));
        if (!item.appear) item.object.position.y = (item.object.userData.baseY ??= item.object.position.y) + ease * .22;
        moving ||= item.amount !== item.target;
      }
      const pulse=(time-m.finish)/870;
      const scan=m.finish>=0 && pulse<1 && !reducedMotion.matches;
      m.sweepMaterial.uniforms.alpha.value=scan?Math.sin(Math.PI*pulse):0;
      m.sweepMaterial.uniforms.position.value=pulse*1.42-.21;
      moving ||= scan || Math.abs(y-m.g.position.y)+Math.abs(m.target-m.amount)>.001;
    }
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sprite = sparkles[i], data = sprite.userData, k = (time - data.born) / data.life;
      moving = true;
      if (k < 0) continue;
      if (k >= 1) {
        scene.remove(sprite);
        sprite.material.dispose();
        sparkles.splice(i, 1);
        continue;
      }
      sprite.scale.setScalar(Math.max(data.size * Math.sin(Math.PI * k), .001));
      sprite.position.y = data.y + data.rise * k;
      sprite.material.rotation = k * 1.6;
      sprite.material.opacity = 1 - k * k;
    }
    moveCamera();
    renderer.render(scene,camera);
    placeMarkers();
    if(moving || (idle && onScreen && active < 0 && currentView==='orbit')) schedule();
    else last=0;
  }
  function schedule() {
    if(!frame) frame=requestAnimationFrame(draw);
  }
  function size() {
    const bounds=sceneElement.getBoundingClientRect();
    width=Math.max(1,bounds.width);
    height=Math.max(1,bounds.height);
    const aspect=width/height;
    const half=Math.max(width<490?9.75:10.15,(width<490?7.4:7.45)*aspect);
    camera.left=-half;
    camera.right=half;
    camera.top=half/aspect;
    camera.bottom=-half/aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    schedule();
  }
  new ResizeObserver(size).observe(sceneElement);
  size();

  function pointerDown(event) {
    if(currentView==='plan' || !event.isPrimary || event.button!==0) return;
    if (idle) { idle=false; lastOrbit=targetTheta; }
    drag={id:event.pointerId,x:event.clientX,theta:targetTheta};
  }
  function pointerMove(event) {
    if(!drag || drag.id!==event.pointerId) return;
    const delta=event.clientX-drag.x;
    if(!sceneElement.classList.contains('dragging') && Math.abs(delta)<6) return;
    if(!sceneElement.hasPointerCapture(event.pointerId)) sceneElement.setPointerCapture(event.pointerId);
    sceneElement.classList.add('dragging');
    targetTheta=drag.theta-delta*.008;
    lastOrbit=targetTheta;
    schedule();
  }
  function release(event) {
    if(!drag || drag.id!==event.pointerId) return;
    drag=undefined;
    sceneElement.classList.remove('dragging');
  }
  sceneElement.addEventListener('pointerdown',pointerDown);
  sceneElement.addEventListener('pointermove',pointerMove);
  sceneElement.addEventListener('pointerup',release);
  sceneElement.addEventListener('pointercancel',release);
  sceneElement.addEventListener('pointerleave',event => {
    if (!sceneElement.hasPointerCapture(event.pointerId)) release(event);
  });

  function changeView(view) {
    currentView=view;
    const fullTurn=2*Math.PI;
    targetTheta=view==='plan'?Math.round(theta/fullTurn)*fullTurn:lastOrbit;
    targetElevation=view==='plan'?Math.PI/2-.002:originElevation;
    sceneElement.style.cursor=view==='plan'?'default':'';
    viewButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.view===view)));
    viewHint.textContent=view==='plan'?'Top-down plan':'Drag to rotate';
    schedule();
  }
  return {
    update(selection,finished,checks) {
      if (selection>=0 && idle) { idle=false; lastOrbit=targetTheta=originTheta; }
      active=selection;
      const phone=width<490;
      if (active>=0) {
        const room=rooms[active];
        lookTarget.set(room.x,.3,room.z);
        targetZoom=(room.d>6?1.24:1.45)*(phone?.94:1);
      } else {
        lookTarget.set(0,.14,0);
        targetZoom=1;
      }
      const now=performance.now();
      models.forEach((m,i) => {
        m.selected=i===active;
        m.complete=finished.has(i);
        m.target=checks[i].size/rooms[i].tasks.length;
        let stagger=0;
        for (const item of m.mess) {
          const target=checks[i].has(item.task)?1:0;
          if (item.keep || target===item.target) continue;
          item.target=target;
          item.startAt=now+stagger;
          item.sparked=target===0;
          stagger+=85;
        }
      });
      schedule();
    },
    celebrate() {
      if (reducedMotion.matches) return;
      models.forEach((m,i) => {
        const room=rooms[i];
        for (let k=0;k<6;k++) {
          worldPoint.set(room.x+(Math.random()-.5)*room.w*.8,.4+Math.random()*.6,room.z+(Math.random()-.5)*room.d*.8);
          sparkle(worldPoint,3,.3,k*140+i*90);
        }
      });
      targetTheta+=.28;
      lastOrbit=targetTheta;
      targetZoom=width<490?.86:.9;
      lookTarget.set(0,width<490?-3.4:-2.6,0);
      schedule();
    },
    finish(index) {
      models[index].finish=performance.now();
      schedule();
    },
    changeView,
    reset() {
      lastOrbit=originTheta;
      targetTheta=originTheta;
      changeView('orbit');
    }
  };
}

try {
  model = buildModel();
} catch(error) {
  model = fallbackModel();
}

[...hotspots, ...stepButtons].forEach(button => {
  button.addEventListener('click', () => selectRoom(Number(button.dataset.room ?? button.dataset.step)));
});
viewButtons.forEach(button => button.addEventListener('click', () => model.changeView(button.dataset.view)));
resetCamera.addEventListener('click', () => model.reset());
jobTasks.addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('input[data-task]')) return;
  hideFinale();
  if (selection < 0) selection = 0;
  const checks = roomChecks[selection];
  const task = Number(input.dataset.task);
  if (input.checked) checks.add(task);
  else checks.delete(task);
  if (isComplete(selection)) roomFinished(selection);
  updateControls();
});
finale.querySelector('.finale-replay').addEventListener('click', replay);

demoAction.addEventListener('click', () => {
  if (rooms.every((_, index) => isComplete(index))) {
    replay();
    return;
  }
  if (selection < 0) {
    selectRoom(0);
    return;
  }
  if (!isComplete(selection)) {
    autoClean(selection);
    return;
  }
  const next = rooms.findIndex((_, index) => index > selection && !isComplete(index));
  selectRoom(next >= 0 ? next : rooms.findIndex((_, index) => !isComplete(index)));
});
updateControls();
