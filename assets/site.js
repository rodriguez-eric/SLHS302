const theme = document.getElementById('contrast');
function setTheme(on) {
  document.documentElement.toggleAttribute('data-contrast', on);
  theme.setAttribute('aria-pressed', String(on));
  document.dispatchEvent(new Event('themechange'));
}
try { setTheme(localStorage.getItem('slhs-contrast') === 'true'); } catch { setTheme(false); }
theme.addEventListener('click', () => {
  const on = theme.getAttribute('aria-pressed') !== 'true';
  try { localStorage.setItem('slhs-contrast', String(on)); } catch {}
  setTheme(on);
});
const fmt = n => Number(n.toFixed(6)).toLocaleString('en-US',{maximumFractionDigits:6});
const round = (n, d=2) => Number(n.toFixed(d));
const question = (prompt, answer, hint, unit='') => ({prompt,answer,hint,unit});
const pick = values => values[Math.floor(Math.random()*values.length)];
const range = n => Array.from({length:n},(_,i)=>i);
const phaseAnswer = (a,f,t,p) => a*Math.sin(2*Math.PI*f*t/1000+p*Math.PI/180);
const clean = n => round(n, 9);
function check(raw, expected) {
  const normalized = raw.trim().toLowerCase().replaceAll('−','-').replaceAll('π','pi');
  if (!normalized) return false;
  return [expected].flat().some(answer=>{
    if(typeof answer==='string') return normalized.replace(/\s+/g,'')===answer.toLowerCase().replace(/\s+/g,'');
    const numeric=normalized.replaceAll(',','');
    const valid=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(numeric);
    const fraction=numeric.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    const value=valid?Number(numeric):fraction?Number(fraction[1])/Number(fraction[2]):NaN;
    return Math.abs(value-answer)<=Math.max(Math.abs(answer)*1e-9,1e-18);
  });
}
let serial=0;
function practice(host, make, visualize) {
  const form=document.createElement('form');
  host.append(form);
  const id=serial++;
  let n=0, questions=[];
  function render(){
    questions=make(n);
    form.innerHTML=questions.map((q,i)=>`<div class="problem"><label for="q-${id}-${i}">${q.prompt}</label><input id="q-${id}-${i}" type="text" autocomplete="off" aria-describedby="f-${id}-${i}"> ${q.unit}<p class="feedback" id="f-${id}-${i}"></p></div>`).join('')+'<div class="actions"><button type="submit">Check answers</button><button type="button">Generate more problems</button></div><p role="status"></p>';
    if(visualize) visualize(n);
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    let count=0;
    questions.forEach((q,i)=>{
      const field=form.querySelector('#q-'+id+'-'+i);
      const correct=check(field.value,q.answer);
      count+=Number(correct);
      field.setAttribute('aria-invalid',String(!correct));
      const answer=[q.answer].flat()[0];
      form.querySelector('#f-'+id+'-'+i).textContent=correct?'Correct. '+(typeof answer==='number'?String(answer):answer)+(q.unit?' '+q.unit:'')+'. '+q.hint:'Try again. '+q.hint;
    });
    form.querySelector('[role=status]').textContent=count+' of '+questions.length+' correct.';
    form.querySelector('[aria-invalid=true]')?.focus();
  });
  form.addEventListener('click',e=>{
    if(!e.target.matches('button[type=button]')) return;
    n++;render();form.querySelector('[role=status]').textContent='New practice problems are ready.';form.querySelector('input')?.focus();
  });
  render();
}
function makeCanvas(host,height=220){
  const canvas=document.createElement('canvas');
  canvas.style.height=height+'px';
  canvas.setAttribute('role','img');
  host.append(canvas);return canvas;
}
function watch(canvas,draw){
  new ResizeObserver(draw).observe(canvas);
  document.addEventListener('themechange',draw);
  draw();
}
function plot(canvas,{maxX=20,minX=0,minY=-4,maxY=4,xLabel='Time (ms)',yLabel='Pressure (Pa)',xTicks,yTicks,traces=[],dots=[],stems=[],guides=[],shade,description}){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!w||!h)return;
  const d=window.devicePixelRatio||1;
  canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
  const ctx=canvas.getContext('2d');ctx.scale(d,d);
  const css=getComputedStyle(canvas), ink=css.getPropertyValue('--ink').trim(), grid=css.getPropertyValue('--grid').trim(), accent=css.getPropertyValue('--accent').trim(), alt=css.getPropertyValue('--alt').trim();
  const left=48,right=w-17,top=30,bottom=h-42;
  const x=v=>left+(v-minX)/(maxX-minX)*(right-left),y=v=>bottom-(v-minY)/(maxY-minY)*(bottom-top);
  const line=(a,b,c,e,color,dash=[])=>{ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,e);ctx.stroke();ctx.setLineDash([]);};
  if(shade){ctx.fillStyle=css.getPropertyValue('--wash');ctx.fillRect(x(shade[0]),top,x(shade[1])-x(shade[0]),bottom-top);}
  ctx.font='12px system-ui';ctx.fillStyle=ink;ctx.fillText(yLabel,8,16);
  ctx.textAlign='right';
  for(const v of yTicks??[minY,0,maxY]){line(left,y(v),right,y(v),v===0?ink:grid);ctx.fillText(fmt(v),left-5,y(v)+4);}
  ctx.textAlign='center';
  for(const tick of xTicks??range(5).map(i=>minX+(maxX-minX)*i/4)){
    const [v,label]=Array.isArray(tick)?tick:[tick,fmt(tick)];
    line(x(v),top,x(v),bottom,grid);ctx.fillText(label,x(v),bottom+16);
  }
  ctx.fillText(xLabel,(left+right)/2,h-6);
  for(const value of guides)line(x(value),top,x(value),bottom,alt,[5,4]);
  traces.forEach((trace,index)=>{
    const fn=typeof trace==='function'?trace:trace.fn;
    ctx.strokeStyle=index%2?alt:accent;ctx.lineWidth=trace.width??2.5;ctx.setLineDash(trace.dash??(index%2?[6,4]:[]));
    ctx.beginPath();for(let i=0;i<=360;i++){const v=minX+(maxX-minX)*i/360;const px=x(v),py=y(fn(v));if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();ctx.setLineDash([]);
  });
  for(const [f,v] of stems){ctx.lineWidth=2;line(x(f),y(Math.max(0,minY)),x(f),y(v),accent);}
  for(const [f,v,label,shape] of [...stems,...dots]){
    ctx.fillStyle=alt;if(shape==='square'){ctx.fillRect(x(f)-4,y(v)-4,8,8);}else{ctx.beginPath();ctx.arc(x(f),y(v),4.5,0,Math.PI*2);ctx.fill();}
    if(label){ctx.fillStyle=ink;ctx.fillText(label,x(f),y(v)-9);}
  }
  canvas.setAttribute('aria-label',description??yLabel+' versus '+xLabel);
  return {x,y,left,right,top,bottom};
}
function controls(host, items, update) {
  const row=document.createElement('div');row.className='controls';host.append(row);
  const inputs=items.map(([name,values,initial])=>{
    const label=document.createElement('label');label.textContent=name;
    const input=document.createElement(Array.isArray(values)?'select':'input');
    if(Array.isArray(values)){for(const item of values){const [value,text]=Array.isArray(item)?item:[item,item];input.add(new Option(text,value));}}
    else{input.type='range';Object.assign(input,values);}
    input.value=initial;label.append(input);row.append(label);input.addEventListener('input',()=>update());return input;
  });
  return inputs;
}
