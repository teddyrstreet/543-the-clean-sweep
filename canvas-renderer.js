'use strict';

function createCanvasRenderer(T,canvas) {
  const context=canvas.getContext('2d');
  if(!context) throw new Error('Canvas is unavailable');
  const geometryCache=new WeakMap();
  const projected=new T.Vector3();
  const viewRay=new T.Vector3();
  const viewProjection=new T.Matrix4();
  const matrix=new T.Matrix4();
  const normalMatrix=new T.Matrix3();
  const normal=new T.Vector3();
  const key=new T.Vector3(-.35,.73,.58).normalize();
  const rim=new T.Vector3(.59,.38,-.64).normalize();
  const hiddenMaterial=new T.Color();
  let width=1,height=1,density=1;

  function getFaces(geometry) {
    if(geometryCache.has(geometry)) return geometryCache.get(geometry);
    const positions=geometry.getAttribute('position');
    const normals=geometry.getAttribute('normal');
    const indices=geometry.getIndex();
    const vertex=i => new T.Vector3().fromBufferAttribute(positions,i);
    const groups=[];
    if(geometry.type==='BoxGeometry') {
      for(let i=0;i<24;i+=4) groups.push({
        vertices:[vertex(i),vertex(i+1),vertex(i+3),vertex(i+2)],
        normal:new T.Vector3().fromBufferAttribute(normals,i)
      });
    } else if(geometry.type==='PlaneGeometry') {
      groups.push({vertices:[vertex(0),vertex(1),vertex(3),vertex(2)],normal:new T.Vector3(0,0,1)});
    } else {
      for(let i=0;i<indices.count;i+=3) {
        const a=vertex(indices.getX(i));
        const b=vertex(indices.getX(i+1));
        const c=vertex(indices.getX(i+2));
        groups.push({vertices:[a,b,c],normal:b.clone().sub(a).cross(c.clone().sub(a)).normalize()});
      }
    }
    geometryCache.set(geometry,groups);
    return groups;
  }
  function screen(v,m) {
    projected.copy(v).applyMatrix4(m);
    return {x:(projected.x*.5+.5)*width,y:(.5-projected.y*.5)*height,z:projected.z};
  }
  function path(vertices) {
    context.beginPath();
    context.moveTo(vertices[0].x,vertices[0].y);
    for(let i=1;i<vertices.length;i++) context.lineTo(vertices[i].x,vertices[i].y);
    context.closePath();
  }
  function xy(x,y,z) {
    return screen(projected.set(x,y,z),viewProjection);
  }
  function stroke(from,to,style) {
    context.beginPath();
    context.moveTo(from.x,from.y);
    context.lineTo(to.x,to.y);
    context.strokeStyle=style;
    context.stroke();
  }
  function grid() {
    context.lineWidth=.65;
    for(let i=-23;i<=23;i++) {
      const style=i%4===0?'#527aa54c':'#527aa52c';
      stroke(xy(i,-.94,-25),xy(i,-.94,25),style);
      stroke(xy(-25,-.94,i),xy(25,-.94,i),style);
    }
    const center=xy(0,-.85,0);
    const shadow=context.createRadialGradient(center.x,center.y,8,center.x,center.y,width*.42);
    shadow.addColorStop(0,'#050c27cc');
    shadow.addColorStop(1,'#050c2700');
    context.fillStyle=shadow;
    context.fillRect(0,0,width,height);
  }
  function colorOf(material,n) {
    const base=material.color??hiddenMaterial.setHex(0x9de9fe);
    const light=.56+.43*Math.max(0,n.dot(key))+.18*Math.max(0,n.dot(rim))+.155*Math.max(0,n.y);
    const blue=.013+.014*Math.max(0,n.dot(rim));
    const convert=value => Math.round(255*(value < .0031308 ? 12.92*value : 1.055*Math.pow(value,1/2.4)-.055));
    return 'rgb('+convert(Math.min(1,base.r*light))+','+convert(Math.min(1,base.g*light+.008))+','+convert(Math.min(1,base.b*light+blue))+')';
  }
  function paintFloor(face) {
    const [a,b,c,d]=face.vertices;
    const map=face.material.map.image;
    context.save();
    path(face.vertices);
    context.clip();
    context.globalAlpha=.22;
    context.globalCompositeOperation='multiply';
    context.transform((b.x-a.x)/map.width,(b.y-a.y)/map.width,(d.x-a.x)/map.height,(d.y-a.y)/map.height,a.x,a.y);
    context.drawImage(map,0,0);
    context.restore();
  }
  function drawSweep(face) {
    const scan=face.material.uniforms;
    if(scan.alpha.value<.001) return;
    const [a,b,c,d]=face.vertices;
    const gradient=context.createLinearGradient(a.x,a.y,b.x,b.y);
    const head=scan.position.value;
    for(let i=0;i<=24;i++){
      const x=i/24;
      const alpha=Math.max(0,1-Math.abs(head-x)*9)*scan.alpha.value*.9;
      gradient.addColorStop(x,'rgba(151,244,255,'+alpha+')');
    }
    path([a,b,c,d]);
    context.fillStyle=gradient;
    context.fill();
  }
  function drawOutline(line) {
    const m=new T.Matrix4().multiplyMatrices(viewProjection,line.matrixWorld);
    const [w,d]=line.userData.dimensions;
    const opacity=line.material.opacity;
    const [left,right,front,back]=[-w/2,w/2,-d/2,d/2];
    const points=[[left,front],[right,front],[right,back],[left,back]].map(([x,z])=>screen(new T.Vector3(x,.035,z),m));
    path(points);
    context.strokeStyle='rgba(149,239,255,'+opacity*.94+')';
    context.lineWidth=1;
    context.stroke();
  }
  function render(scene,camera) {
    scene.updateMatrixWorld(true);
    viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    camera.getWorldDirection(viewRay).negate();
    context.setTransform(density,0,0,density,0,0);
    context.clearRect(0,0,width,height);
    grid();
    const bottom=[];
    const furnishings=[];
    const outlines=[];
    scene.traverseVisible(object=>{
      if(object.isLineSegments && object.userData.outline && object.material.opacity>0) outlines.push(object);
      if(!object.isMesh || object.material.isShadowMaterial) return;
      matrix.multiplyMatrices(viewProjection,object.matrixWorld);
      normalMatrix.getNormalMatrix(object.matrixWorld);
      for(const face of getFaces(object.geometry)) {
        normal.copy(face.normal).applyMatrix3(normalMatrix).normalize();
        if(normal.dot(viewRay)<.001) continue;
        const material=object.material;
        const vertices=face.vertices.map(v=>screen(v,matrix));
        const depth=vertices.reduce((sum,v)=>sum+v.z,0)/vertices.length;
        const spec={vertices,depth,material,color:material.isShaderMaterial?'':colorOf(material,normal),floor:!!material.map&&normal.y>.9};
        (object.userData.foundation?bottom:furnishings).push(spec);
      }
    });
    function paint(face) {
      if(face.material.isShaderMaterial) {
        drawSweep(face);
        return;
      }
      context.globalAlpha=face.material.opacity;
      path(face.vertices);
      context.fillStyle=face.color;
      context.fill();
      context.strokeStyle=face.color;
      context.lineWidth=.42;
      context.stroke();
      context.globalAlpha=1;
      if(face.floor) paintFloor(face);
    }
    bottom.filter(face=>!face.material.isShaderMaterial).sort((a,b)=>b.depth-a.depth).forEach(paint);
    bottom.filter(face=>face.material.isShaderMaterial).forEach(paint);
    outlines.forEach(drawOutline);
    furnishings.sort((a,b)=>b.depth-a.depth).forEach(paint);
  }
  return {
    render,
    setPixelRatio(value){density=value;},
    setSize(w,h){width=w;height=h;canvas.width=Math.ceil(w*density);canvas.height=Math.ceil(h*density);},
    capabilities:{getMaxAnisotropy(){return 1;}},
    shadowMap:{}
  };
}
