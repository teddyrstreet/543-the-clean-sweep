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

  model.update(selection, complete);
}

function selectRoom(index) {
  selection = index;
  updateControls();
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
    return {g,top,initial,cleaned,outline,sweepMaterial,finish:-1,amount:0,target:0,selected:false};
  });

  const originTheta = isResidential ? -.35 : .43;
  const originElevation=.66;
  let theta=originTheta, elevation=originElevation, targetTheta=theta, targetElevation=elevation;
  let lastOrbit=theta;
  let currentView='orbit';
  let width=1, height=1, frame=0, last=0, active=-1, drag;
  const point=new T.Vector3();
  const look=new T.Vector3(0,.14,0);
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
      hotspots[index].hidden=false;
    });
  }
  function draw(time) {
    frame=0;
    const dt=last ? Math.min(time-last,36):16;
    last=time;
    const blend=reducedMotion.matches?1:1-Math.pow(.81,dt/16);
    theta+=(targetTheta-theta)*blend;
    elevation+=(targetElevation-elevation)*blend;
    let moving=Math.abs(targetTheta-theta)+Math.abs(targetElevation-elevation)>.0009;
    for(const m of models) {
      const y=m.selected && currentView==='orbit'?.33:0;
      m.g.position.y+=(y-m.g.position.y)*blend;
      m.amount+=(m.target-m.amount)*blend*.53;
      if (reducedMotion.matches) m.amount=m.target;
      m.top.color.copy(m.initial).lerp(m.cleaned,m.amount);
      m.top.roughness=.83-m.amount*.41;
      m.outline.material.opacity=m.selected?.91:m.target?.37:0;
      const pulse=(time-m.finish)/870;
      const scan=m.finish>=0 && pulse<1 && !reducedMotion.matches;
      m.sweepMaterial.uniforms.alpha.value=scan?Math.sin(Math.PI*pulse):0;
      m.sweepMaterial.uniforms.position.value=pulse*1.42-.21;
      moving ||= scan || Math.abs(y-m.g.position.y)+Math.abs(m.target-m.amount)>.001;
    }
    moveCamera();
    renderer.render(scene,camera);
    placeMarkers();
    if(moving) schedule();
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
    update(selection,finished) {
      active=selection;
      models.forEach((m,i) => {
        m.selected=i===active;
        m.target=finished.has(i)?1:0;
      });
      schedule();
    },
    finish(index) {
      models[index].finish=performance.now();
      schedule();
    },
    changeView,
    reset() {
      lastOrbit=originTheta;
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
  if (selection < 0) selection = 0;
  const checks = roomChecks[selection];
  const task = Number(input.dataset.task);
  if (input.checked) checks.add(task);
  else checks.delete(task);
  if (isComplete(selection)) model.finish(selection);
  updateControls();
});

demoAction.addEventListener('click', () => {
  if (rooms.every((_, index) => isComplete(index))) {
    roomChecks.forEach(checks => checks.clear());
    selectRoom(-1);
    model.reset();
    return;
  }
  if (selection < 0) {
    selectRoom(0);
    return;
  }
  if (!isComplete(selection)) {
    rooms[selection].tasks.forEach((_, index) => roomChecks[selection].add(index));
    model.finish(selection);
    updateControls();
    return;
  }
  const next = rooms.findIndex((_, index) => index > selection && !isComplete(index));
  selectRoom(next >= 0 ? next : rooms.findIndex((_, index) => !isComplete(index)));
});
updateControls();
