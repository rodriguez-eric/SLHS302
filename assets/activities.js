const widgets = {};
const q = question;
const buildButton = (host,title,handler) => {
  const button=document.createElement('button');button.type='button';button.textContent=title;button.addEventListener('click',handler);host.append(button);return button;
};
function note(host,text='',tag='p'){
  const element=document.createElement(tag);element.textContent=text;host.append(element);return element;
}
function live(host,items,paint,height){
  let fields;
  fields=controls(host,items,()=>draw());
  const canvas=makeCanvas(host,height),info=note(host);
  info.className='rule';
  const draw=()=>{const result=paint(fields.map(field=>field.value),canvas);if(result!==undefined)info.textContent=result;};
  watch(canvas,draw);
  return {fields,canvas,draw,info};
}
const triples=[[5,12,13],[8,15,17],[7,24,25],[9,40,41],[12,16,20],[15,20,25]];
const indexed=(values,n)=>values[n%values.length];
const formats = [['Hz','kHz',0.001,569],['kHz','Hz',1000,0.52],['s','ms',1000,0.341],['ms','s',0.001,0.8]];
widgets.units=host=>{
  for(const [from,to,factor,example] of formats){
    note(host,from+' to '+to,'h3');
    note(host,`${example} ${from} ${factor>1?'×':'÷'} 1,000 = ${fmt(example*factor)} ${to}. The decimal moves three places ${factor>1?'right':'left'}.`);
    practice(host,n=>range(3).map(i=>{
      const value=(137+n*31+i*81)/(i===0?1:i===1?100:1000);
      return q(`${fmt(value)} ${from} =`,clean(value*factor),factor>1?'Multiply by 1,000.':'Divide by 1,000.',to);
    }));
  }
};
function triangle(canvas,angle,labels){
  const d=window.devicePixelRatio||1,w=canvas.clientWidth;if(!w)return;
  canvas.width=w*d;canvas.height=175*d;
  const c=canvas.getContext('2d');c.scale(d,d);
  const x=w/2-63,end=x+130;
  const style=getComputedStyle(canvas);
  c.strokeStyle=style.getPropertyValue('--accent');c.fillStyle=style.getPropertyValue('--ink');c.lineWidth=2;
  c.beginPath();c.moveTo(x,30);c.lineTo(x,135);c.lineTo(end,135);c.closePath();c.stroke();
  c.strokeRect(x,123,12,12);
  c.font='13px system-ui';c.textAlign='center';
  c.fillText(labels[0],x-23,85);c.fillText(labels[1],x+62,155);c.fillText(labels[2],x+84,69);
  c.fillText('∠ '+angle,angle==='A'?end-31:x+19,angle==='A'?126:61);
  canvas.setAttribute('aria-label',`Right angle at lower left. Marked angle ${angle} is at the ${angle==='A'?'lower right':'upper left'}. Side labels: vertical ${labels[0]}, horizontal ${labels[1]}, slanted ${labels[2]}.`);
}
widgets.triangles=host=>{
  const [angle]=controls(host,[['Marked angle',['A','B'],'A']],()=>render());
  const diagram=makeCanvas(host,175),quiz=document.createElement('div');host.append(quiz);
  let form;
  function render(){
    triangle(diagram,angle.value,['Side 1','Side 2','Side 3']);
    if(form)form.remove();
    const arrangement=angle.value==='A'?['opposite','adjacent','hypotenuse']:['adjacent','opposite','hypotenuse'];
    form=document.createElement('form');quiz.append(form);
    form.innerHTML=arrangement.map((_,i)=>`<label>Side ${i+1} <select><option value="">Choose a label</option><option>opposite</option><option>adjacent</option><option>hypotenuse</option></select></label> `).join('')+' <button type="submit">Check labels</button><p role="status"></p>';
    form.onsubmit=e=>{e.preventDefault();const entries=[...form.querySelectorAll('select')];form.querySelector('p').textContent=entries.map((field,i)=>`Side ${i+1}: ${field.value===arrangement[i]?'Correct':'Try again'}`).join(' · ');};
  }
  render();watch(diagram,()=>triangle(diagram,angle.value,['Side 1','Side 2','Side 3']));
  practice(host,n=>[2,1,0].map((missing,i)=>{
    const lengths=indexed(triples,n+i);const names=['opposite leg','adjacent leg','hypotenuse'];
    return q(`Find the ${names[missing]} when the ${names[(missing+1)%3]} is ${lengths[(missing+1)%3]} and the ${names[(missing+2)%3]} is ${lengths[(missing+2)%3]}.`,lengths[missing],missing===2?'Add the squares of the legs, then take the square root.':'Subtract the known leg’s square from the hypotenuse’s square, then take the square root.');
  }));
};
widgets.trig=host=>{
  const diagram=makeCanvas(host,175);
  watch(diagram,()=>triangle(diagram,'A',['9','12','15']));
  practice(host,n=>{
    const [a,b,c]=indexed(triples,n),type=n%3;
    const [name,top,bottom]=[['tangent',a,b],['sine',a,c],['cosine',b,c]][type];
    const sides=[['opposite and adjacent','opposite ÷ adjacent'],['opposite and hypotenuse','opposite ÷ hypotenuse'],['adjacent and hypotenuse','adjacent ÷ hypotenuse']][type];
    const [d,e,f]=indexed(triples,n+2);
    return [q(`Which function uses ${sides[0]}?`,[name,name==='tangent'?'tan':name==='sine'?'sin':'cos'],'Use SOH CAH TOA.'),
      q(`Angle A has opposite ${a}, adjacent ${b}, hypotenuse ${c}. Find that ratio as a fraction or to two decimals.`,[top/bottom,round(top/bottom)],sides[1]+'.'),
      q(`Find the opposite leg when the adjacent leg is ${e} and hypotenuse is ${f}.`,d,'Use the Pythagorean theorem.'),
      q('Find sine using that missing leg. Enter a fraction or round to two decimals.',[d/f,round(d/f)],'Divide opposite by hypotenuse.')];
  });
};
const radians=['0','π/4','π/2','3π/4','π','5π/4','3π/2','7π/4','2π'];
const cycleLabels=['0','1/8','1/4','3/8','1/2','5/8','3/4','7/8','1'];
function circleVisual(host){
  const row=document.createElement('div');row.className='grid';
  const [slider]=controls(host,[['Advance by eighth-turns',{min:0,max:8,step:1},0]],()=>draw());
  host.append(row);
  const circle=makeCanvas(row),wave=makeCanvas(row),out=note(host);
  function draw(){
    const k=Number(slider.value),theta=k*Math.PI/4;
    const w=circle.clientWidth,d=window.devicePixelRatio||1;if(!w)return;
    circle.width=w*d;circle.height=220*d;
    const c=circle.getContext('2d');c.scale(d,d);
    const s=getComputedStyle(circle),x=w/2,y=111,r=Math.min(72,w/2-33);
    c.strokeStyle=s.getPropertyValue('--accent');c.fillStyle=s.getPropertyValue('--ink');c.font='12px system-ui';c.textAlign='center';
    c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.stroke();
    c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();
    if(k){c.lineWidth=4;c.beginPath();c.arc(x,y,r,0,-theta,true);c.stroke();}
    const px=x+r*Math.cos(theta),py=y-r*Math.sin(theta);
    c.beginPath();c.moveTo(x,y);c.lineTo(px,py);c.stroke();c.beginPath();c.arc(px,py,5,0,2*Math.PI);c.fill();
    c.fillText('90°',x,y-r-8);c.fillText('180°',x-r-15,y-9);c.fillText('270°',x,y+r+16);c.fillText('0° / 360°',x+r-4,y+20);
    const reading=`${k*45}° = ${radians[k]} radians = ${cycleLabels[k]} cycles. Height on both plots: ${fmt(Math.sin(theta))}.`;
    circle.setAttribute('aria-label','Unit circle. '+reading);out.textContent=reading;slider.setAttribute('aria-valuetext',reading);
    plot(wave,{maxX:360,minY:-1.2,maxY:1.2,xLabel:'Phase (degrees)',yLabel:'Relative height',yTicks:[-1,0,1],traces:[v=>Math.sin(v*Math.PI/180)],dots:[[k*45,Math.sin(theta),'A']],description:reading});
  }
  watch(circle,draw);watch(wave,draw);
}
widgets.circle=host=>{
  circleVisual(host);
  const table=document.createElement('table');host.append(table);
  let n=0;
  function render(){
    const steps=[2,4,6,1].map((k,i)=>i===3?1+2*(n%4):2*((k/2+n)%5));
    const forms=steps.map((k,i)=>({k,given:(i+n)%3}));
    const units=['Degrees','Radians','Cycles'];
    const values=k=>[k*45,radians[k],cycleLabels[k]];
    table.innerHTML='<thead><tr>'+units.map(u=>'<th scope="col">'+u+'</th>').join('')+'</tr></thead><tbody>'+forms.map(({k,given},i)=>'<tr>'+units.map((u,j)=>j===given?'<td><strong>'+values(k)[j]+'</strong></td>':`<td><input type="text" aria-label="Row ${i+1}, ${u}" data-step="${k}" data-unit="${j}"><span class="feedback"></span></td>`).join('')+'</tr>').join('')+'</tbody>';
  }
  render();
  buildButton(host,'Check answers',()=>{
    for(const field of table.querySelectorAll('input')){
      const k=Number(field.dataset.step),unit=Number(field.dataset.unit);
      const values=[k*45,radians[k],k/8];const answer=unit===1?[radians[k].replace('π','pi')]:values[unit];
      const correct=check(field.value.replace(/°$/,''),answer);
      field.setAttribute('aria-invalid',String(!correct));
      field.nextElementSibling.textContent=correct?'Correct.':'Try again. One full turn is 360°, 2π radians, or 1 cycle.';
    }
  });
  buildButton(host,'Generate more problems',()=>{n++;render();table.querySelector('input').focus();});
};
widgets.exponents=host=>{
  const laws=['Product of powers','Quotient of powers','Power of a power','Power of a product','Power of a quotient','Zero exponent','Negative exponent'];
  note(host,'Choose the law and enter the missing exponent or numerical value.');
  const form=document.createElement('form');host.append(form);let index=0;
  const banks=[[4,2,2,6,2,4,3,2,4,2],[2,5,1,4,3,2,2,3,3,2],[5,3,3,5,2,5,4,2,2,3],[3,4,2,3,4,2,5,2,6,3]];
  let rows=[];
  function render(){
    const [a,b,c,d,e,f,g,h,i,j]=banks[index];
    rows=[
      [0,`10<sup>${a}</sup> × 10<sup>${b}</sup> = 10<sup>□</sup>`,a+b],
      [1,`10<sup>${c}</sup> ÷ 10<sup>${d}</sup> = 10<sup>□</sup>`,c-d],
      [2,`(10<sup>${e}</sup>)<sup>${f}</sup> = 10<sup>□</sup>`,e*f],
      [3,`(${g} × 10)<sup>${h}</sup> = □`,(g*10)**h],
      [4,`(${i}/10)<sup>${j}</sup> = □`,Number(`${i**j}e-${j}`)],
      [5,`${a+1}<sup>0</sup> = □`,1],[6,`10<sup>−${d}</sup> = □`,Number('1e-'+d)]];
    rows.push(...rows.splice(0,index));
    form.innerHTML=rows.map(([law,prompt],row)=>`<fieldset><legend>${prompt}</legend><div class="controls"><label>Law<select><option value="">Choose a law</option>${laws.map((name,i)=>`<option value="${i}">${name}</option>`).join('')}</select></label><label>${law<3?'Missing exponent':'Numerical value'}<input type="text" autocomplete="off"></label></div><p class="feedback" id="law-result-${row}"></p></fieldset>`).join('')+'<div class="actions"><button type="submit">Check answers</button><button type="button">Generate more problems</button></div><p role="status"></p>';
  }
  form.onsubmit=e=>{
    e.preventDefault();let score=0;
    [...form.querySelectorAll('fieldset')].forEach((group,i)=>{
      const [law,,answer]=rows[i],lawCorrect=group.querySelector('select').value===String(law),value=check(group.querySelector('input').value,answer);
      score+=Number(lawCorrect)+Number(value);
      group.querySelector('p').textContent=(lawCorrect?'Correct law.':'Try again on the law.')+' '+(value?'Correct value.':'Try again on the value.');
    });
    form.querySelector('[role=status]').textContent=score+' of 14 responses correct.';
  };
  form.onclick=e=>{if(e.target.matches('button[type=button]')){index=(index+1)%4;render();form.querySelector('select').focus();}};
  render();
};
widgets.scientific=host=>{
  for(const kind of ['Powers of ten','Standard to scientific','Scientific to standard']){
    note(host,kind,'h3');
    practice(host,n=>range(3).map(i=>{
      const exponent=[1+n%6,-1-n%6,0][i],c=(101+((n*43+i*169)%890))/100;
      if(kind==='Powers of ten')return q(`Evaluate 10<sup>${i===2?n%3-1:exponent}</sup>.`,10**(i===2?n%3-1:exponent),'For a negative exponent, take the reciprocal.');
      if(kind==='Standard to scientific')return q(`Write ${fmt(Number(c+'e'+exponent))} in scientific notation using e notation.`,[c+'e'+exponent, c+'e+'+exponent],'Use one nonzero digit before the decimal and the appropriate power of 10.');
      return q(`Write ${c} × 10<sup>${exponent}</sup> in standard notation.`,Number(c+'e'+exponent),'Positive exponents move the decimal right, negative exponents move it left.');
    }));
  }
};
widgets.logs=host=>practice(host,n=>{
  const p=1+n%5,m=-1-(n+2)%5,v=11+(39+n*7)%89;
  const result=[q(`log(${fmt(10**p)})`,p,'Find the exponent on 10.'),q('log(1)',0,'Any nonzero base raised to zero gives 1.'),q(`log(${fmt(10**m)})`,m,'An input between 0 and 1 gives a negative answer.'),q(`log(${v}), rounded to three decimals.`,round(Math.log10(v),3),'Use the LOG key.')];
  result.push(indexed([q('Use the quotient law to find log(1,000/10).',2,'Subtract 1 from 3.'),q('Use the product law to find log(100 × 1,000).',5,'Add 2 and 3.'),q('Use the power law to find log(100²).',4,'Multiply 2 by log(100).')],n));return result;
});
function wavePractice(host,kind){
  const canvas=makeCanvas(host),details=note(host);
  let data;
  const periods=[8,4,5,10,16,20];
  function draw(){
    const {T,A,p,t}=data;
    const pressure=ms=>phaseAnswer(A,1000/T,ms,p);
    plot(canvas,{maxX:2*T,minY:-5,maxY:5,yTicks:[-5,-4,-3,-2,-1,0,1,2,3,4,5],traces:[pressure],dots:kind==='period'?[[0,pressure(0),'A'],[T/2,pressure(T/2),data.labels[0]],[T,pressure(T),data.labels[1]],[1.5*T,pressure(1.5*T),data.labels[2]]]:[[t,pressure(t),'A']],guides:kind==='period'?[0,T/2,T,1.5*T]:[t],description:kind==='period'?`Wave with A at time zero and points ${data.labels.map((letter,i)=>letter+' at '+(i+1)*T/2+' milliseconds').join(', ')}. It begins at phase ${p} degrees.`:`Wave with peak ${A} pascals and a period of ${T} milliseconds. Point A is at ${t} milliseconds and ${clean(pressure(t))} pascals. At time zero it ${['crosses upward','is at the crest','crosses downward','is at the trough'][p/90%4]}.`});
    details.textContent=kind==='period'?`Starting phase: ${p}°. Choose the next matching point after A.`:`Point A is at ${fmt(t)} ms.`+(kind==='phase'?` Period: ${T} ms.`:'');
  }
  practice(host,n=>{
    const sequence=kind==='complete'?n%840:n;
    const T=kind==='complete'?periods[(sequence+1)%6]:indexed(periods,n);
    const A=kind==='complete'?1+(Math.floor(sequence/6)+2)%5:1+(n+2)%5;
    const p=kind==='complete'?90*((Math.floor(sequence/30)+2)%4):90*((n+1)%4);
    const marker=kind==='complete'?1+(Math.floor(sequence/120)+4)%7:1+n%7;
    const t=T*marker/4;
    data={T,A,p:kind==='period'?(1+n%4)*90:p,t,labels:indexed([['B','C','D'],['D','B','C'],['C','D','B']],n)};
    const a=clean(phaseAnswer(A,1000/T,t,p)),total=p+90*marker;
    const timing=[q('Period',T,'Subtract the times of matching points one cycle apart.','ms'),q('Frequency',1000/T,'Take the reciprocal of the period in seconds.','Hz')];
    const amp=[q('Instantaneous amplitude at A',a,'Read the vertical value at A and keep its sign.','Pa'),q('Peak amplitude',A,'Measure from equilibrium to the crest.','Pa'),q('Peak-to-peak amplitude',2*A,'Subtract the trough from the crest.','Pa'),q('RMS amplitude, to three decimals',[round(A/Math.SQRT2,3),round(A*.707,3)],'Multiply the peak by 0.707 or divide by √2.','Pa')];
    const phase=[q('Starting phase within one cycle',p,'Use the height and direction at time zero.','°'),q('Instantaneous phase at A including full turns',total,'Add 360° × elapsed time ÷ period to the starting phase.','°'),q('Phase at A within one cycle',total%360,'Subtract whole turns of 360°.','°')];
    return kind==='period'?[q('Which point completes one full cycle from A?',data.labels[1].toLowerCase(),'Match the height and direction at A.'),...timing]:kind==='amplitude'?amp:kind==='phase'?phase:[...timing,...amp,...phase];
  },draw);
  watch(canvas,draw);
}
widgets.period=host=>{
  live(host,[['Start of cycle (ms)',{min:0,max:4,step:.125},1]],([v],canvas)=>{
    const t=Number(v),fn=ms=>phaseAnswer(1,250,ms,0);
    plot(canvas,{maxX:8,minY:-1.5,maxY:1.5,traces:[fn],shade:[t,t+4],dots:[[t,fn(t),'Start'],[t+4,fn(t+4),'End']]});
    return `Start ${t} ms · End ${t+4} ms · Period 4 ms · Frequency 250 Hz. Peak to peak and matching zero crossings are easiest to spot.`;
  });
  note(host,'Try it · Read a new waveform','h3');wavePractice(host,'period');
};
widgets.amplitude=host=>{
  live(host,[['Measure',['Instantaneous','Peak','Peak-to-peak','RMS'],'Instantaneous'],['Time marker (ms)',{min:0,max:16,step:.25},6]],([mode,t],canvas)=>{
    const time=Number(t),fn=ms=>phaseAnswer(4,125,ms,0);
    const marks=mode==='Instantaneous'?[[time,fn(time),'A']]:mode==='Peak'?[[2,4,'Peak'],[2,0,'Equilibrium']]:mode==='Peak-to-peak'?[[2,4,'Crest'],[6,-4,'Trough']]:[[2,4,'Read peak first'],[8,4/Math.SQRT2,'RMS']];
    plot(canvas,{maxX:16,minY:-6,maxY:6,yTicks:[-4,-2,0,2,4],traces:[fn],dots:marks,guides:mode==='Instantaneous'?[time]:[]});
    return `At ${time} ms: instantaneous ${fmt(fn(time))} Pa. The whole-wave measurements stay fixed: peak 4 Pa · peak-to-peak 8 Pa · RMS 2.828 Pa.`;
  });
  note(host,'Try it · Read the amplitude','h3');wavePractice(host,'amplitude');
};
widgets.phase=host=>{
  circleVisual(host);
  live(host,[['Starting phase (degrees)',[0,90,180,270],90],['Time (ms)',{min:0,max:16,step:1},6]],([p,t],canvas)=>{
    const phase=Number(p),time=Number(t),fn=ms=>phaseAnswer(1,125,ms,phase),total=phase+45*time;
    plot(canvas,{maxX:16,minY:-1.5,maxY:1.5,traces:[fn],dots:[[0,fn(0),'Start','square'],[time,fn(time),'A']],guides:[time]});
    return `Starting phase ${phase}° · Phase added ${45*time}° · Instantaneous phase ${total}° total, or ${total%360}° within one cycle.`;
  });
  note(host,'Try it · Read and calculate phase','h3');wavePractice(host,'phase');
};
widgets.complete=host=>wavePractice(host,'complete');
widgets.propagation=host=>{
  const [time]=controls(host,[['Elapsed time (ms)',{min:0,max:8,step:.25},0]],()=>draw());
  const particles=makeCanvas(host,100),pressure=makeCanvas(host,200),reading=note(host);
  function draw(){
    const elapsed=Number(time.value),w=particles.clientWidth,d=window.devicePixelRatio||1,span=2.8;
    if(!w)return;
    const wave=x=>Math.cos(2*Math.PI*(x/1.4-elapsed/4));
    const displaced=x=>x-.145*Math.sin(2*Math.PI*(x/1.4-elapsed/4));
    const marker=displaced(1.4);
    particles.width=w*d;particles.height=100*d;
    const c=particles.getContext('2d');c.scale(d,d);
    const css=getComputedStyle(particles),x=p=>48+p/span*(w-65);
    c.fillStyle=css.getPropertyValue('--ink');c.font='12px system-ui';c.fillText('Air particles',8,17);
    for(let i=0;i<140;i++){
      const p=span*i/140;if(wave(p)>0){c.globalAlpha=.3*wave(p);c.fillStyle=css.getPropertyValue('--accent');c.fillRect(x(p),26,x(span/140)-x(0)+1,45);}
    }
    c.globalAlpha=1;
    for(let i=0;i<=24;i++){
      const p=displaced(span*i/24);if(p<0||p>span)continue;
      c.fillStyle=i===12?'#a34d12':css.getPropertyValue('--ink');c.beginPath();
      if(i===12)c.fillRect(x(p)-5,44,10,10);
      else {c.arc(x(p),49,3,0,2*Math.PI);c.fill();}
    }
    c.strokeStyle=css.getPropertyValue('--ink');c.beginPath();c.moveTo(x(1.4),65);c.lineTo(x(1.4),81);c.stroke();
    const atParticle=wave(1.4);
    plot(pressure,{maxX:span,minY:-1.25,maxY:1.25,xLabel:'Position (m)',yLabel:'Relative pressure',yTicks:[-1,0,1],traces:[wave],dots:[[marker,wave(marker),'Tracked particle','square']],guides:[marker]});
    reading.textContent=`${elapsed} ms · The pressure pattern has moved ${fmt(.35*elapsed)} m to the right. The square marks the tracked location on both plots. Particle motion is exaggerated.`;
    particles.setAttribute('aria-label',reading.textContent+(Math.abs(atParticle)<1e-8?' The particle is near equilibrium pressure.':''));
  }
  watch(particles,draw);watch(pressure,draw);
};
function axesPair(host,T,L,axisLabels=['Time (ms)','Position (m)']){
  const row=document.createElement('div');row.className='grid';host.append(row);
  for(const [i,span] of [T,L].entries()){
    const canvas=makeCanvas(row,170);
    watch(canvas,()=>plot(canvas,{maxX:2*span,minY:-1.3,maxY:1.3,xLabel:axisLabels[i],yLabel:'Relative pressure',yTicks:[-1,0,1],traces:[x=>Math.cos(2*Math.PI*x/span)],dots:[[0,1,'A'],[span,1,'B']],guides:[0,span]}));
  }
}
widgets.twoaxes=host=>{axesPair(host,4,1.4);note(host,'The microphone’s period is 4 ms. In the position snapshot, its wavelength is 1.4 m. At 350 m/s, the wave moves 1.4 m in 0.004 s.');};
widgets.speed=host=>{
  const canvas=makeCanvas(host,165);let distance;
  const draw=()=>plot(canvas,{maxX:distance*2,minY:-1.3,maxY:1.3,xLabel:'Position (m)',yLabel:'Relative pressure',yTicks:[-1,0,1],traces:[x=>Math.cos(2*Math.PI*x/distance)],dots:[[0,1,'A'],[distance,1,'B']]});
  practice(host,n=>{
    distance=indexed([.7,1.4,2,.4,3.5,.8],n);
    const f=indexed([.5,1,2.5,4,.25,1.25],n),cm=indexed([35,25,70,125,14,28],n),ms=indexed([8,2.5,4,10,12.5,20],n);
    return [q('Find the wavelength shown on the position graph.',distance,'Subtract the positions at A and B.','m'),q(`Find wavelength for a ${f} kHz tone.`,350/(f*1000),'Convert to Hz and use λ = c/f.','m'),q(`Find frequency for a ${cm} cm wavelength.`,35000/cm,'Convert to meters and use f = c/λ.','Hz'),q(`Find wavelength for a ${ms} ms period.`,.35*ms,'Convert to seconds and use λ = cT.','m')];
  },draw);watch(canvas,draw);
};
widgets.speedwrap=host=>{
  axesPair(host,20,7);
  practice(host,n=>[
    ...(n===0?[q('What does the spacing on the time graph measure?','period','The horizontal axis measures time.')]:[]),
    q('How much time passes between A and B on the time graph?',20,'Divide 7 m by 350 m/s and convert to milliseconds.','ms'),
    q('How many cycles does the microphone record each second?',50,'Take the reciprocal of 0.020 s.','Hz')]);
};
widgets.db=host=>{
  note(host,'Round levels to two decimals. For linear values, use decimal or e notation, such as 2e-5.');
  practice(host,n=>{
    const a=indexed([10,2,.5,100,5,.1],n),b=indexed([.5,2,10,.1,50,1],n),p=indexed([40,60,80,0,-20,20],n),i=indexed([30,60,90,20,-10,80],n);
    const allowed=(gain,ratio,factor)=>ratio===2||ratio===.5?[gain,Math.sign(gain)*(factor===20?6:3)]:gain;
    return [q(`Convert ${(2e-5*a).toExponential(3)} Pa RMS to sound pressure level.`,allowed(round(20*Math.log10(a)),a,20),'Divide by 20 µPa, take LOG, then multiply by 20.','dB SPL'),
      q(`Convert ${p} dB SPL to RMS pressure.`,2e-5*10**(p/20),'Divide the level by 20, raise 10 to that power, and multiply by 20 µPa.','Pa'),
      q(`Convert ${(1e-12*b).toExponential(3)} W/m² to sound intensity level.`,allowed(round(10*Math.log10(b)),b,10),'Divide by 10⁻¹², take LOG, and multiply by 10.','dB IL'),
      q(`Convert ${i} dB IL to intensity.`,1e-12*10**(i/10),'Multiply the reference intensity by 10 raised to the level divided by 10.','W/m²')];
  });
};
widgets.distance=host=>{
  const [field]=controls(host,[['Listener distance (m)',{min:.5,max:4,step:.25},2]],()=>draw());
  const reveal=document.createElement('details');reveal.innerHTML='<summary>Reveal intensity and level change</summary>';host.append(reveal);
  const out=note(reveal),canvas=makeCanvas(host,210);
  function draw(){
    const r=Number(field.value),w=canvas.clientWidth,d=window.devicePixelRatio||1;
    if(!w)return;
    canvas.width=w*d;canvas.height=210*d;const ctx=canvas.getContext('2d');ctx.scale(d,d);
    const css=getComputedStyle(canvas),x=w/2,y=100,scale=Math.min(20,(w-40)/8);
    for(const radius of [1,2,3,4,r]){
      ctx.strokeStyle=css.getPropertyValue(radius===r?'--accent':'--grid');ctx.setLineDash(radius===1?[4,4]:[]);
      ctx.beginPath();ctx.arc(x,y,radius*scale,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle=css.getPropertyValue('--ink');ctx.fillRect(x-4,y-4,8,8);ctx.fillRect(x+r*scale-4,y-4,8,8);
    ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('Source',x,202);ctx.fillText(r+' m',x+r*scale,y-12);
    out.textContent=`At ${r} m the intensity is ${fmt(100/r**2)}% of the value at 1 m. Level change: ${round(20*Math.log10(1/r))} dB.`;
    canvas.setAttribute('aria-label',`Concentric rings show spherical spreading. Listener is at ${r} meters. Reference distance is one meter.`);
  }
  watch(canvas,draw);
};
widgets.distancePractice=host=>practice(host,n=>{
  const [I,a,b,L,c,d,to]=indexed([[.012,2,4,84,2,5,2],[.006,3,6,72,1,4,.5],[.02,1,2,80,1,2,3],[.014,8,4,78,2,1,4],[.003,6,3,68,3,9,1.5],[.008,5,10,95,8,2,2.5]],n);
  const change=(from,end)=>20*Math.log10(from/end);
  const accepted=(from,end,base=0)=>[round(base+change(from,end)),...(end===2*from?[base-6]:from===2*end?[base+6]:[])];
  return [q(`Intensity is ${I} W/m² at ${a} m. Find intensity at ${b} m.`,I*(a/b)**2,'Multiply by the square of original distance divided by new distance.','W/m²'),
    q(`The level is ${L} dB SPL at ${c} m. Find the level at ${d} m.`,accepted(c,d,L),'Add 20 × LOG(original distance ÷ new distance) to the starting level.','dB SPL'),
    q(`What is the level change at ${to} m relative to 1 m?`,accepted(1,to),'A move farther away gives a negative value. Use 20 × LOG(1 ÷ new distance).','dB')];
});
widgets.adding=host=>practice(host,n=>{
  const equal=indexed([50,40,70,80,30,60],n),different=indexed([[80,70],[60,40],[50,60],[70,50],[60,80],[40,50]],n);
  return [[equal,equal],different].flatMap(([A,B])=>{
    const a=1e-12*10**(A/10),b=1e-12*10**(B/10),sum=a+b;
    return [q(`${A} and ${B} dB SPL. Find intensity I<sub>A</sub>.`,a,'Use the 10⁻¹² reference and raise 10 to Lₐ/10.','W/m²'),
      q(`${A} and ${B} dB SPL. Find intensity I<sub>B</sub>.`,b,'Use the 10⁻¹² reference and raise 10 to Lᵦ/10.','W/m²'),
      q(`${A} and ${B} dB SPL. Find total intensity I<sub>A</sub> + I<sub>B</sub>.`,sum,'Add the two intensities.','W/m²'),
      q(`${A} and ${B} dB SPL. Find the combined level.`,[round(10*Math.log10(sum/1e-12)),...(A===B?[A+3]:[])],'Divide the total by the reference, take LOG, and multiply by 10.','dB SPL')];
  });
});
function choicePractice(host,bank){
  const prompt=note(host),row=document.createElement('div');row.className='actions';host.append(row);
  const feedback=note(host);feedback.setAttribute('role','status');
  let current=0;
  function render(){
    const [text,choices,answer,explanation]=bank[current];
    prompt.textContent=text;feedback.textContent='';row.replaceChildren();
    choices.forEach((choice,i)=>buildButton(row,choice,()=>{feedback.textContent=(i===answer?'Correct. ':'Try again. ')+explanation;}));
  }
  buildButton(host,'Next question',()=>{current=(current+1)%bank.length;render();row.firstChild.focus();});render();
}
widgets.interference=host=>{
  const [phase,time]=controls(host,[['Relative phase (°)',[0,90,180],0],['Time marker (ms)',{min:0,max:20,step:.25},2.5]],()=>draw());
  const plots=['Wave A · solid','Wave B · dashed','Combined wave · bold'].map(label=>{note(host,label,'h3');return makeCanvas(host,155);});
  const result=note(host);
  function draw(){
    const p=Number(phase.value),t=Number(time.value),a=ms=>phaseAnswer(1,100,ms,0),b=ms=>phaseAnswer(1,100,ms,p);
    const functions=[a,b,ms=>p===180?0:a(ms)+b(ms)];
    plots.forEach((c,i)=>plot(c,{minY:-2.1,maxY:2.1,yTicks:[-2,-1,0,1,2],yLabel:'Relative pressure',traces:[{fn:functions[i],dash:i===1?[7,4]:[],width:i===2?3.5:2.3}],dots:[[t,functions[i](t),'A']],guides:[t]}));
    const relation=Math.abs(a(t)*b(t))<1e-8?'At least one wave is at equilibrium.':a(t)*b(t)>0?'At the marker, the waves reinforce.':'At the marker, the waves oppose.';
    result.textContent=({0:'Full constructive interference. The combined wave is twice as tall.',90:'The waves are a quarter cycle apart.',180:'Full destructive interference. The combined wave is flat.'}[p])+' '+relation;
  }
  plots.forEach(c=>watch(c,draw));
};
widgets.room=host=>choicePractice(host,[
  ['Two equal waves reach their positive peak together. What happens?',['They reinforce','They oppose'],0,'The waves are on the same side of equilibrium.'],
  ['A peak lines up with an equally deep trough. What happens at that instant?',['They reinforce','They cancel'],1,'Equal pressures of opposite sign cancel.'],
  ['A weaker reflection is in opposite phase with the direct sound. What happens?',['It reduces the direct sound','It cancels the direct sound completely'],0,'Unequal amplitudes give partial cancellation.'],
  ['Two waves are a quarter cycle apart. What happens over time?',['They always reinforce','They reinforce at some moments and oppose at others'],1,'Compare which side of equilibrium each wave is on.'],
  ['What can change when you move across the room?',['The relative phase of direct and reflected sound','The frequency emitted by the speaker'],0,'Different path lengths change the arrival phase.']
]);
widgets.standing=host=>live(host,[['Resonator',[['string','String fixed at both ends'],['tube','Air tube open at one end']],'string'],['Mode',[1,2,3],1],['Time through cycle (%)',{min:0,max:100,step:1},0]],([kind,n,t],canvas)=>{
  const count=kind==='tube'?2*Number(n)-1:2*Number(n),shape=x=>Math.sin(Math.PI*count*x/2),motion=Math.cos(2*Math.PI*t/100);
  plot(canvas,{maxX:1,minY:-1.3,maxY:1.3,xLabel:'Position along resonator',yLabel:kind==='tube'?'Relative pressure':'String displacement',yTicks:[-1,0,1],traces:[{fn:shape,dash:[5,4],width:1},{fn:x=>-shape(x),dash:[5,4],width:1},{fn:x=>motion*shape(x),width:3}],dots:range(count+1).map(i=>[i/count,0,'',i%2?'circle':'square']),description:`Mode ${n}, ${t}% into cycle. Squares represent fixed node locations. Circles represent antinode locations.`});
  return `${t}% through the cycle. Squares mark nodes and circles mark antinodes. ${kind==='tube'?'Open end: pressure node. Closed end: pressure antinode.':'Both fixed ends are displacement nodes.'} The length spans ${count}/4 of a wavelength.`;
});
widgets.resonance=host=>{
  const [length,freq]=controls(host,[['Model canal length (cm)',[2.5,3.5],2.5],['Driving frequency (Hz)',{min:2000,max:5000,step:25},2000]],()=>draw());
  const a=makeCanvas(host,185),b=makeCanvas(host,185),out=note(host);
  function draw(){
    const f=Number(freq.value),peak=350/(4*Number(length.value)/100),strength=x=>1/Math.hypot(1,(x-peak)/(peak*.075));
    plot(a,{minX:2000,maxX:5000,minY:0,maxY:1.15,xLabel:'Driving frequency (Hz)',yLabel:'Relative response',yTicks:[0,.5,1],traces:[strength],dots:[[f,strength(f),'A']],description:`Response peaks at ${fmt(peak)} hertz.`});
    plot(b,{maxX:2,minY:-1.1,maxY:1.1,yLabel:'Relative closed-end pressure',yTicks:[-1,0,1],traces:[t=>phaseAnswer(strength(f),f,t,0)]});
    out.textContent=`${fmt(f)} Hz · ${Math.round(strength(f)*100)}% of peak amplitude in this simplified model. Sweep the driving frequency to find the strongest response.`;
  }
  watch(a,draw);watch(b,draw);
};
widgets.nodes=host=>choicePractice(host,[
  ['A point stays at equilibrium throughout a cycle. What is it?',['Node','Antinode'],0,'A node stays at equilibrium. An antinode moves by the greatest amount.'],
  ['Which tube has the lower first resonant frequency?',['Shorter tube','Longer tube'],1,'A longer tube fits a longer wavelength at the same sound speed.']
]);
widgets.diffraction=host=>{
  const [ratio]=controls(host,[['Wavelength ÷ barrier width',{min:.25,max:1.75,step:.05},1]],()=>draw());
  const canvas=makeCanvas(host,245),reading=note(host);
  function draw(){
    const w=canvas.clientWidth,d=window.devicePixelRatio||1,r=Number(ratio.value);if(!w)return;
    const text=`${r.toFixed(2)} × barrier width. ${r<.8?'Shorter wavelength gives a more pronounced shadow.':r>1.2?'Longer wavelength spreads farther into the shadow.':'Comparable wavelength bends into part of the shadow.'}`;
    canvas.width=w*d;canvas.height=245*d;canvas.setAttribute('aria-label',text);reading.textContent=text;
    const c=canvas.getContext('2d');c.scale(d,d);const css=getComputedStyle(canvas),wall=w*.42,s=Math.min(60,w*.2),top=122-s/2,bot=122+s/2,step=s*r,bend=(r-.25)/1.5,half=s*(.43-.4*bend);
    c.fillStyle=css.getPropertyValue('--ink');c.globalAlpha=.36-.28*bend;
    c.beginPath();c.moveTo(wall,top);c.lineTo(w-9,122-half);c.lineTo(w-9,122+half);c.lineTo(wall,bot);c.fill();c.globalAlpha=1;
    c.strokeStyle=css.getPropertyValue('--accent');c.lineWidth=1.6;
    for(let x=wall-step/2;x>8;x-=step){c.beginPath();c.moveTo(x,40);c.lineTo(x,208);c.stroke();}
    c.save();c.beginPath();c.rect(wall,38,w-wall-9,175);c.clip();
    for(let rr=step/2;rr<w-wall+step;rr+=step){
      for(const [y,a,b] of [[top,-Math.PI/2,.16+.97*bend],[bot,-.16-.97*bend,Math.PI/2]]){c.beginPath();c.arc(wall,y,rr,a,b);c.stroke();}
    }
    c.restore();c.fillStyle=css.getPropertyValue('--ink');c.fillRect(wall-4,top,8,s);c.fillRect(w*.74-5,117,10,10);
    c.font='12px system-ui';c.fillText('Incoming sound →',10,23);c.textAlign='center';c.fillText('Barrier',wall,232);c.fillText('Listener',w*.74,232);
  }
  watch(canvas,draw);
  note(host,'Try it · Predict what reaches the listener','h3');
  choicePractice(host,[
    ['Which tone tends to reach farther into the shadow behind the same barrier?',['Low tone','High tone'],0,'At the same speed, a lower frequency has a longer wavelength.'],
    ['Which barrier tends to produce a more pronounced shadow at the same frequency?',['Narrower barrier','Wider barrier'],1,'The wider barrier is larger relative to the wavelength.'],
    ['What does a sound shadow tell you?',['The level is reduced','The level is always zero'],0,'Sound can still spread around a barrier.']]);
};
widgets.periodicity=host=>{
  const row=document.createElement('div');row.className='grid';host.append(row);
  let seed=415,marked=false;
  const noise=range(361).map(()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return 2*seed/4294967296-1;});
  const a=makeCanvas(row,150),b=makeCanvas(row,150),out=note(host);
  function draw(){
    for(const [canvas,fn,label] of [[a,t=>phaseAnswer(1,100,t,0)+phaseAnswer(.5,200,t,0),'Periodic complex waveform'],[b,t=>noise[Math.round(t*18)],'Aperiodic noise sample']]){
      plot(canvas,{minY:-1.6,maxY:1.6,yLabel:label,yTicks:[0],traces:[fn],guides:marked?[10]:[],shade:marked?[0,10]:null,description:label+' over 20 milliseconds.'});
    }
    out.textContent=marked?'Compare the full shapes in the first and second 10 ms intervals. Only the periodic waveform repeats.':'Predict whether the first 10 ms of each waveform repeats in the second 10 ms.';
  }
  const button=buildButton(host,'Mark the two 10 ms intervals',()=>{marked=!marked;button.setAttribute('aria-pressed',String(marked));draw();});
  button.setAttribute('aria-pressed','false');watch(a,draw);watch(b,draw);
};
function gcd(a,b){while(b)[a,b]=[b,a%b];return a;}
widgets.builder=host=>{
  const frequencies=[100,200,300],active=new Set(frequencies);
  const buttonRow=document.createElement('div');buttonRow.className='actions';host.append(buttonRow);
  const buttons=frequencies.map(f=>buildButton(buttonRow,f+' Hz',()=>{if(active.has(f))active.delete(f);else active.add(f);draw();}));
  const [amplitude,phase]=controls(host,[['200 Hz amplitude',{min:.25,max:2,step:.25},1],['200 Hz phase (°)',{min:0,max:360,step:15},0]],()=>draw());
  const plots=[...frequencies,'Combined'].map(()=>makeCanvas(host,135)),out=note(host);
  function draw(){
    const selected=frequencies.filter(f=>active.has(f)),f0=selected.reduce(gcd,0);
    const component=(f,t)=>active.has(f)?phaseAnswer(f===200?Number(amplitude.value):1,f,t,f===200?Number(phase.value):0):0;
    frequencies.forEach((f,i)=>{
      buttons[i].setAttribute('aria-pressed',String(active.has(f)));
      plot(plots[i],{minY:-2.2,maxY:2.2,yTicks:[-2,0,2],yLabel:f+' Hz'+(active.has(f)?'':' (off)'),traces:[t=>component(f,t)]});
    });
    plot(plots[3],{minY:-4.2,maxY:4.2,yTicks:[-4,0,4],yLabel:'Combined waveform',traces:[t=>frequencies.reduce((sum,f)=>sum+component(f,t),0)],shade:f0?[0,1000/f0]:null});
    out.textContent=f0?`Period ${fmt(1000/f0)} ms · Fundamental ${f0} Hz.`+(!active.has(f0)?` The ${f0} Hz component is absent.`:''):'All components are off.';
    amplitude.disabled=phase.disabled=!active.has(200);
  }
  plots.forEach(c=>watch(c,draw));
  note(host,'Predict · Remove one component at a time','h3');
  const text=note(host),response=note(host),row=document.createElement('div');row.className='actions';host.append(row);
  let stage=0;
  function setComponents(values){active.clear();values.forEach(f=>active.add(f));draw();}
  const predictions=['Stays the same','Gets shorter','Gets longer'].map((title,index)=>buildButton(row,title,()=>{
    const correct=stage===0?0:1;
    setComponents(stage===0?[200,300]:[200]);
    response.textContent=(index===correct?'Correct. ':'Compare your prediction with the result. ')+(stage===0?'The 200 and 300 Hz components share a 100 Hz fundamental. The period is still 10 ms.':'Only the 200 Hz tone remains. Its period is 5 ms.');
    predictions.forEach(button=>button.disabled=true);
    next.disabled=stage!==0;
  }));
  const next=buildButton(row,'Next removal',()=>setup(1));
  buildButton(row,'Restart prediction',()=>setup(0));
  function setup(value){
    stage=value;setComponents(stage===0?frequencies:[200,300]);
    text.textContent=stage===0?'Start with 100 + 200 + 300 Hz. What happens to the period when you remove 100 Hz?':'Start with 200 + 300 Hz. What happens when you remove 300 Hz?';
    response.textContent='';predictions.forEach(button=>button.disabled=false);next.disabled=true;
  }
  setup(0);
};
function harmonicExercise(host,kind){
  const form=document.createElement('form');host.append(form);let index=0,data;
  const match=[[100,[2,3,5]],[80,[2,3,4]],[120,[1,3,5]],[75,[1,2,5]],[125,[1,3,4]],[160,[2,4,5]]];
  const calculate=[150,80,125,200,90,240],ord=['1st','2nd','3rd','4th','5th'];
  function render(){
    const [f,which]=kind==='match'?match[index]:[calculate[index],[1,2,3,4,5]];
    const values=which.map(n=>n*f);
    const rows=kind==='match'?values.map((v,i)=>[v+' Hz',which[i]]):ord.map((label,i)=>[label+' harmonic',values[i]]);
    const selected=kind==='match'?[1,2,3,4,5].filter(n=>!which.includes(n)):[2,4];
    data={rows,selected,f};
    const prompt=kind==='match'?`A sound has fundamental frequency ${f} Hz and contains ${values.join(', ')} Hz. What harmonic number goes with each component?`:`The fundamental is ${f} Hz. Calculate the first five harmonic frequencies, counting the fundamental as the 1st.`;
    form.innerHTML=`<p>${prompt}</p><table><thead><tr><th scope="col">${kind==='match'?'Component':'Harmonic'}</th><th scope="col">${kind==='match'?'Harmonic number':'Frequency (Hz)'}</th></tr></thead><tbody>${rows.map(([label])=>`<tr><th scope="row">${label}</th><td><input type="text" aria-label="Answer for ${label}"><span class="feedback"></span></td></tr>`).join('')}</tbody></table><fieldset><legend>${kind==='match'?'Which of the first five harmonics are missing?':'Which harmonics are one or more whole octaves above the fundamental?'}</legend><div class="controls">${ord.map((s,i)=>`<label><span><input type="checkbox" value="${i+1}"> ${s} harmonic</span></label>`).join('')}</div><p class="feedback"></p></fieldset><div class="actions"><button type="submit">Check answers</button><button type="button">Generate new question</button></div><p role="status"></p>`;
  }
  form.onsubmit=e=>{
    e.preventDefault();let score=0;
    [...form.querySelectorAll('input[type=text]')].forEach((field,i)=>{
      const result=check(field.value,data.rows[i][1]);score+=Number(result);field.setAttribute('aria-invalid',String(!result));
      field.nextElementSibling.textContent=result?'Correct.':kind==='match'?'Divide the component frequency by '+data.f+' Hz.':'Multiply the harmonic number by '+data.f+' Hz.';
    });
    const values=[...form.querySelectorAll(':checked')].map(field=>Number(field.value));
    const correct=values.join()===data.selected.join();score+=Number(correct);
    form.querySelector('fieldset p').textContent=correct?'Correct. '+data.selected.map(n=>ord[n-1]).join(' and ')+'.':kind==='match'?'Compare the listed components with the first five harmonic frequencies.':'Starting at the fundamental, double it and then double again.';
    form.querySelector('[role=status]').textContent=score+' of '+(data.rows.length+1)+' correct.';
  };
  form.onclick=e=>{if(e.target.matches('button[type=button]')){index=(index+1)%6;render();form.querySelector('input').focus();}};
  render();
}
widgets.matchHarmonics=host=>harmonicExercise(host,'match');
widgets.octaves=host=>harmonicExercise(host,'calculate');
widgets.views=host=>{
  live(host,[['View',[['wave','Waveform'],['amp','Amplitude spectrum'],['phase','Phase spectrum']],'wave'],['Phase of 160 Hz (°)',[0,90,180,270],90]],([view,phase],canvas)=>{
    const p=Number(phase);
    if(view==='wave')plot(canvas,{maxX:25,minY:-3,maxY:3,traces:[t=>phaseAnswer(2,80,t,0)+phaseAnswer(1,160,t,p)]});
    else plot(canvas,{maxX:240,minY:0,maxY:view==='amp'?3:360,xLabel:'Frequency (Hz)',yLabel:view==='amp'?'Peak amplitude (Pa)':'Starting phase (°)',xTicks:[0,80,160,240],yTicks:view==='amp'?[0,1,2,3]:[0,90,180,270,360],stems:view==='amp'?[[80,2],[160,1]]:[[80,0],[160,p]]});
    return view==='wave'?'The whole shape repeats every 12.5 ms.':view==='amp'?'80 Hz: 2 Pa peak. 160 Hz: 1 Pa peak.':`80 Hz: 0°. 160 Hz: ${p}°.`;
  });
};
widgets.spectrogram=host=>{
  const [slider]=controls(host,[['Marker time (s)',{min:0,max:1,step:.01},.25]],()=>draw());
  const canvas=makeCanvas(host),reading=note(host);
  function draw(){
    const time=Number(slider.value),description=`${time.toFixed(2)} s · ${time<.5?'Only 80 Hz is present.':'80 Hz and 160 Hz are both present.'}`;
    const coords=plot(canvas,{maxX:1,minY:0,maxY:240,xLabel:'Time (s)',yLabel:'Frequency (Hz)',yTicks:[0,80,160,240],description});
    if(!coords)return;
    const d=window.devicePixelRatio||1,ctx=canvas.getContext('2d'),{x,y}=coords,css=getComputedStyle(canvas);
    ctx.setTransform(d,0,0,d,0,0);
    ctx.fillStyle=css.getPropertyValue('--accent');ctx.fillRect(x(0),y(80)-5,x(1)-x(0),10);
    ctx.globalAlpha=.5;ctx.fillRect(x(.5),y(160)-4,x(1)-x(.5),8);ctx.globalAlpha=1;
    ctx.strokeStyle=css.getPropertyValue('--alt');ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x(time),y(0));ctx.lineTo(x(time),y(240));ctx.stroke();ctx.setLineDash([]);
    reading.textContent=description+' The darker 80 Hz band represents the stronger component.';
  }
  watch(canvas,draw);
  choicePractice(host,[
    ['Which graph helps you measure a repeating time interval?',['Amplitude spectrum','Waveform','Phase spectrum'],1,'The waveform has time on the horizontal axis.'],
    ['Which view shows where a component starts in its cycle?',['Phase spectrum','Spectrogram'],0,'A phase spectrum shows the starting phase by frequency.'],
    ['Which frequency is present throughout this spectrogram?',['160 Hz','80 Hz','Both'],1,'The 80 Hz band spans the entire second.']]);
};
widgets.drawSpectrum=host=>{
  const frequencies=[80,160,240,320,400],sounds=[
    [[80,2,0],[160,1,90],[320,3,270]],[[160,3,180],[240,2,0]],[[80,1,270],[240,3,90],[400,2,0]],
    [[160,2,90],[320,1,180],[400,3,0]],[[80,3,180],[160,2,270],[400,1,90]],[[240,1,0],[320,3,90],[400,2,270]]];
  let current=0;
  const table=document.createElement('table');host.append(table);
  const graphs=[['Amplitude spectrum','Peak amplitude (Pa)',[0,1,2,3],1],['Phase spectrum','Starting phase (°)',[0,90,180,270],2]].map(([name,yLabel,ticks,column])=>{
    note(host,name,'h3');const canvas=makeCanvas(host),details=document.createElement('details');details.innerHTML='<summary>Place or remove marks using controls</summary>';host.append(details);const feedback=note(host);feedback.setAttribute('role','status');
    return {canvas,details,feedback,yLabel,ticks,column,marks:new Map(),fields:new Map(),coords:null};
  });
  const closest=(values,distance)=>values.reduce((a,b)=>distance(a)<=distance(b)?a:b);
  function draw(g){
    g.coords=plot(g.canvas,{maxX:440,minY:0,maxY:g.ticks.at(-1),xLabel:'Frequency (Hz)',yLabel:g.yLabel,xTicks:frequencies,yTicks:g.ticks,stems:[...g.marks],description:g.yLabel+'. '+([...g.marks].map(([f,v])=>f+' Hz at '+v).join(', ')||'No marks placed.')});
  }
  function place(g,f,v){if(v===null)g.marks.delete(f);else g.marks.set(f,v);g.fields.get(f).value=v===null?'':String(v);g.feedback.textContent='';draw(g);}
  for(const g of graphs){
    const fields=controls(g.details,frequencies.map(f=>[f+' Hz',[['','No mark'],...g.ticks.filter(v=>g.column===2||v!==0)],'']),()=>{});
    fields.forEach((field,i)=>{const f=frequencies[i];g.fields.set(f,field);field.onchange=()=>place(g,f,field.value===''?null:Number(field.value));});
    g.canvas.addEventListener('click',e=>{
      if(!g.coords)return;
      const rect=g.canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;
      const {x,y,left,right,top,bottom}=g.coords;
      if(px<left||px>right||py<top-10||py>bottom+10)return;
      const f=closest(frequencies,v=>Math.abs(x(v)-px)),v=closest(g.ticks,value=>Math.abs(y(value)-py));
      place(g,f,g.marks.get(f)===v||g.column===1&&v===0?null:v);
    });
    watch(g.canvas,()=>draw(g));
  }
  function reset(){for(const g of graphs){g.marks.clear();g.fields.forEach(field=>field.value='');g.feedback.textContent='';draw(g);}}
  function render(){table.innerHTML='<thead><tr><th scope="col">Frequency (Hz)</th><th scope="col">Peak (Pa)</th><th scope="col">Phase (°)</th></tr></thead><tbody>'+sounds[current].map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody>';reset();}
  const row=document.createElement('div');row.className='actions';host.append(row);
  buildButton(row,'Check both spectra',()=>{
    for(const g of graphs){
      const expected=new Map(sounds[current].map(row=>[row[0],row[g.column]]));
      const hints=frequencies.filter(f=>expected.get(f)!==g.marks.get(f)).map(f=>`${f} Hz: ${!expected.has(f)?'remove the extra mark':!g.marks.has(f)?'place a mark':'check the height'}.`);
      g.feedback.textContent=hints.length?'Try again. '+hints.join(' '):'Correct. All components are plotted.';
    }
  });
  buildButton(row,'Clear marks',reset);
  buildButton(row,'Generate another sound',()=>{current=(current+1)%sounds.length;render();});
  render();
};
const filterNames=[['low','Low-pass'],['high','High-pass'],['band','Band-pass'],['stop','Band-stop']];
const spectrumF=[250,500,1000,2000];
const frequencyPosition=f=>Math.log2(f/125);
const spectrumTicks=spectrumF.map(f=>[frequencyPosition(f),fmt(f)]);
function filterPlot(canvas,label,values,{response,edges=[],gain=false}={}){
  const guides=edges.map(frequencyPosition);
  const stems=values?.map((level,i)=>[frequencyPosition(spectrumF[i]),level])??[];
  const description=label+'. '+(values?spectrumF.map((f,i)=>f+' Hz at '+fmt(values[i])+' dB').join(', '):response?'The dashed markers locate the cutoff or band edges.':'Output hidden.');
  plot(canvas,{maxX:5,minY:gain?-45:0,maxY:gain?8:72,xLabel:'Frequency (Hz, logarithmic scale)',yLabel:label,xTicks:spectrumTicks,yTicks:gain?[-40,-20,0]:[0,30,60],stems,guides,traces:response?[p=>response(125*2**p)]:[],description});
}
widgets.filterBasics=host=>{
  const [component]=controls(host,[['Highlight frequency (Hz)',spectrumF,1000]],()=>draw());
  const canvases=range(3).map(()=>makeCanvas(host,162)),reading=note(host);
  const input=[54,52,60,56],gains=[0,6,-12,-18];
  let revealed=false;
  const reveal=buildButton(host,'Reveal output spectrum',()=>{revealed=!revealed;reveal.textContent=revealed?'Hide output spectrum':'Reveal output spectrum';reveal.setAttribute('aria-pressed',String(revealed));draw();});
  reveal.setAttribute('aria-pressed','false');
  function draw(){
    const f=Number(component.value),i=spectrumF.indexOf(f),edges=[f];
    filterPlot(canvases[0],'Input spectrum (dB SPL)',input,{edges});
    filterPlot(canvases[1],'Filter gain (dB)',gains,{gain:true,edges});
    filterPlot(canvases[2],revealed?'Output spectrum (dB SPL)':'Output spectrum hidden',revealed?input.map((v,j)=>v+gains[j]):null,{edges});
    reading.textContent=`${fmt(f)} Hz · Input ${input[i]} dB SPL · Gain ${gains[i]} dB`+(revealed?` · Output ${input[i]+gains[i]} dB SPL.`:'. Predict the output before revealing it.');
  }
  canvases.forEach(c=>watch(c,draw));
  note(host,'Try it · Find the output level','h3');
  practice(host,n=>{
    const [f,v,g]=indexed([[500,65,-9],[250,52,0],[1000,48,6],[2000,72,-15],[750,54,8],[1500,63,-7.5]],n);
    return [q(`A ${fmt(f)} Hz component enters at ${v} dB SPL. Gain at that frequency is ${g} dB. Find the output level.`,v+g,'Add the signed gain to the input level.','dB SPL')];
  });
};
function distanceIntoFilter(type,p,lo,hi){
  if(type==='low')return p-lo;
  if(type==='high')return lo-p;
  if(type==='band')return Math.max(lo-p,p-hi);
  return Math.min(p-lo,hi-p);
}
widgets.filterTypes=host=>{
  const [type,lower,upper]=controls(host,[['Filter type',filterNames,'low'],['Cutoff or lower edge (Hz)',[250,500,750,1000,1500,2000],750],['Upper band edge (Hz)',[500,750,1000,1500,2000,3000],1500]],()=>{revealed=false;draw();});
  const canvases=range(3).map(()=>makeCanvas(host,165)),reading=note(host);
  let revealed=false;
  const reveal=buildButton(host,'Reveal output spectrum',()=>{revealed=!revealed;draw();});
  function draw(){
    const isBand=['band','stop'].includes(type.value),lo=Number(lower.value);
    upper.parentElement.hidden=!isBand;
    upper.parentElement.style.display=isBand?'':'none';
    for(const option of upper.options)option.disabled=Number(option.value)<=lo;
    if(Number(upper.value)<=lo)upper.value=[...upper.options].find(o=>!o.disabled).value;
    const hi=Number(upper.value);
    const response=f=>{
      const slope=distanceIntoFilter(type.value,Math.log2(f),Math.log2(lo),Math.log2(hi));
      return slope<=0?-3*Math.max(0,1+slope/.32)**2:-3-33*(1-Math.exp(-3*slope));
    };
    const edges=isBand?[lo,hi]:[lo],out=spectrumF.map(f=>60+response(f));
    filterPlot(canvases[0],'Input spectrum (dB SPL)',[60,60,60,60],{edges});
    filterPlot(canvases[1],'Filter response (dB)',null,{edges,response,gain:true});
    filterPlot(canvases[2],revealed?'Output spectrum (dB SPL)':'Output spectrum hidden',revealed?out:null,{edges});
    reveal.textContent=revealed?'Hide output spectrum':'Reveal output spectrum';
    reveal.setAttribute('aria-pressed',String(revealed));
    reading.textContent=revealed?spectrumF.map((f,i)=>fmt(f)+' Hz: '+out[i].toFixed(1)+' dB SPL').join(' · '):'Each input component is 60 dB SPL. The dashed markers cross the response at −3 dB.';
  }
  canvases.forEach(c=>watch(c,draw));
  note(host,'Try it · Choose a filter','h3');
  const options=filterNames.map(([,name])=>name);
  choicePractice(host,[
    ['Reduce low rumble while keeping higher sounds.',options,1,'A high-pass filter attenuates lower frequencies.'],
    ['Keep the frequencies between two band edges.',options,2,'A band-pass filter passes components within the band.'],
    ['Reduce a narrow band around a hum.',options,3,'A band-stop filter attenuates frequencies inside a band.'],
    ['Reduce high hiss while keeping lower sounds.',options,0,'A low-pass filter attenuates higher frequencies.']]);
};
const rollSources={
  low:[[500,1,6],[250,1,12],[750,1,3],[1000,1,6]],
  high:[[2000,-1,6],[4000,-1,12],[1600,-1,3],[1000,-1,6]],
  band:[[500,-1,6],[4000,1,12],[800,-1,3],[2000,1,6]],
  stop:[[250,1,6],[4000,-1,12],[200,1,3],[3200,-1,6]]
};
function rollGraph(canvas,type,start,direction,rate,counts,active){
  const before=type==='band'?-4:-1,after=type==='stop'?5:3,minX=Math.min(before*direction,after*direction),maxX=Math.max(before*direction,after*direction);
  const f=p=>start*2**p;
  const gain=p=>{
    const along=p*direction;
    const into=type==='band'?Math.max(along,-3-along):type==='stop'?Math.min(along,4-along):along;
    return into<0?Math.min(0,-3-12*into):-3-into*rate;
  };
  const xTicks=range(maxX-minX+1).map(i=>i+minX).filter(p=>canvas.clientWidth>470||[0,...counts.map(k=>k*direction)].includes(p)).map(p=>[p,fmt(f(p))]);
  plot(canvas,{minX,maxX,minY:-42,maxY:0,xLabel:'Frequency (Hz, logarithmic scale)',yLabel:'Gain (dB)',yTicks:[-40,-30,-20,-10,0],xTicks,traces:[gain],guides:counts.map(c=>c*direction),dots:[[0,-3,'Start','square'],...(active?[[(active*direction),gain(active*direction),'A']]:[])],description:`Starting gain is minus 3 dB at ${fmt(start)} hertz. Gain drops ${rate} dB per octave toward ${direction>0?'higher':'lower'} frequencies. ${counts.map(c=>fmt(f(c*direction))+' Hz').join(' and ')} marked by dashed guides.`});
}
widgets.rolloff=host=>{
  live(host,[['Filter type',filterNames,'low'],['Band edge',[['lower','Lower'],['upper','Upper']],'lower'],['Rate (dB/octave)',[3,6,12],6],['Octaves into the slope',{min:0,max:2,step:1},1]],([type,edge,rate,count],canvas)=>{
    const direction=type==='low'||(type==='band'&&edge==='upper')||(type==='stop'&&edge==='lower')?1:-1;
    const start=(type==='low'||type==='high')?1000:type==='band'?(edge==='lower'?500:4000):edge==='lower'?250:4000;
    rollGraph(canvas,type,start,direction,Number(rate),[Number(count)],Number(count));
    const f=start*2**(count*direction);
    return `${fmt(start)} Hz to ${fmt(f)} Hz · ${count} octave steps · −3 − (${count} × ${rate}) = ${-3-count*rate} dB.`;
  });
};
widgets.rolloffPractice=host=>{
  let offset=0,data;
  const [type]=controls(host,[['Practice filter',filterNames,'low']],()=>reset());
  const prompt=note(host),canvas=makeCanvas(host),quiz=document.createElement('div');host.append(quiz);
  function draw(){if(data)rollGraph(canvas,...data,[1,2]);}
  function reset(){
    quiz.replaceChildren();
    practice(quiz,n=>{
      const [start,direction,rate]=indexed(rollSources[type.value],n+offset);
      data=[type.value,start,direction,rate];
      const side=type.value==='band'?(direction<0?'lower edge':'upper edge'):type.value==='stop'?(direction>0?'lower edge':'upper edge'):'cutoff';
      prompt.textContent=`The gain at the ${fmt(start)} Hz ${side} is −3 dB. The roll-off is ${rate} dB per octave. The square marks the start. Each dashed line marks a target.`;
      return [1,2].flatMap(count=>{
        const f=fmt(start*2**(count*direction));
        return [q(`How many octaves from the start to ${f} Hz?`,count,'Count doublings or halvings.'),q(`What is the gain at ${f} Hz?`,-3-count*rate,'Subtract the octave count times the rate from −3 dB.','dB')];
      });
    },draw);
  }
  reset();watch(canvas,draw);
};
for(const host of document.querySelectorAll('[data-widget]')){
  const name=host.dataset.widget;
  widgets[name](host);
}
const target=document.getElementById(location.hash.slice(1));
if(target?.tagName==='DETAILS')target.open=true;
const heroWave=document.getElementById('hero-wave');
if(heroWave)watch(heroWave,()=>{
  const w=heroWave.clientWidth,h=heroWave.clientHeight,d=window.devicePixelRatio||1;
  if(!w||!h)return;
  heroWave.width=w*d;heroWave.height=h*d;
  const ctx=heroWave.getContext('2d');ctx.scale(d,d);
  const css=getComputedStyle(heroWave);
  ctx.strokeStyle=css.getPropertyValue('--line');
  for(let x=6;x<w;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=6;y<h;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.strokeStyle=css.getPropertyValue('--accent');ctx.lineWidth=2.25;ctx.beginPath();
  for(let i=0;i<=300;i++){const x=i*w/300,y=h/2-h*.27*(i/300)*Math.sin(i/300*4*Math.PI);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
  ctx.stroke();
});
