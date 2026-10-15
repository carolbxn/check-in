"use strict";
const DB='mdi-local-v1',STORE='entries';let db,photo=null,items=[];window.entries=[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const BACKUP_META='mdi-backup-v6';
function backupMeta(){try{return JSON.parse(localStorage.getItem(BACKUP_META)||'{}')}catch{return {}}}
function setBackupMeta(m){localStorage.setItem(BACKUP_META,JSON.stringify(m));renderBackupStatus()}
function backupDue(){let m=backupMeta(),n=(window.entries||[]).length;if(!n)return false;if(!m.confirmedAt)return true;let previous=Number.isInteger(m.confirmedCount)?m.confirmedCount:0;return n>previous && Date.now()-Date.parse(m.confirmedAt)>7*86400000}
function renderBackupStatus(){let el=$('#backupStatus');if(!el)return;let m=backupMeta();let days=m.confirmedAt?Math.floor((Date.now()-Date.parse(m.confirmedAt))/86400000):null;el.textContent=m.confirmedAt?`Último backup marcado como salvo: ${new Date(m.confirmedAt).toLocaleString('pt-BR')} (${days} dia(s) atrás).`:'Nenhum backup externo confirmado neste dispositivo.';$('#backupPending').textContent=m.pendingAt?'Backup gerado e verificado internamente. Confirme somente após encontrar o arquivo em Arquivos/iCloud Drive.':'Faça uma cópia externa pelo menos uma vez por semana.';$('#confirmBackupBtn').hidden=!m.pendingAt;el.classList.toggle('backupOverdue',backupDue());let hint=$('#backupReminder');if(hint){hint.hidden=!backupDue();hint.textContent='Backup recomendado. Toque para abrir Meus dados.'}}
async function persistentStorage(){let el=$('#storageStatus');if(!navigator.storage?.persist){el.textContent='Este navegador não oferece essa solicitação. Continue fazendo backups externos.';return}try{let granted=await navigator.storage.persist();el.textContent=granted?'Armazenamento persistente concedido neste navegador. Continue fazendo backups externos.':'O navegador não concedeu armazenamento persistente. Continue fazendo backups externos.'}catch{el.textContent='Não foi possível solicitar persistência neste navegador.'}}

const markers=['Lactose','Trigo/glúten','Cafeína','Álcool','Fritura','Pimenta','Adoçantes','Vegetais crus','Leguminosas'];
const symptoms=['Dor abdominal','Urgência evacuatória','Sangue nas fezes','Muco','Distensão abdominal','Gases','Fadiga','Náusea','Diarreia','Constipação','Perda de apetite','Outro'];
const contextTags=['Antibiótico','Mudança de tratamento','Possível infecção','Viagem','Sono ruim','Atividade física intensa','Estresse excepcional'];
const catalog=[
['arroz','Cereais e tubérculos',[]],['macarrão','Cereais e tubérculos',['Trigo/glúten']],['massa','Cereais e tubérculos',['Trigo/glúten']],['pão','Cereais e tubérculos',['Trigo/glúten']],['torrada','Cereais e tubérculos',['Trigo/glúten']],['batata','Cereais e tubérculos',[]],['mandioca','Cereais e tubérculos',[]],['aveia','Cereais e tubérculos',[]],['bolo','Doces e sobremesas',[]],['biscoito','Ultraprocessados',[]],['bolacha','Ultraprocessados',[]],['chocolate','Doces e sobremesas',[]],['sorvete','Doces e sobremesas',['Lactose']],
['frango','Carnes, peixes e ovos',[]],['carne moída','Carnes, peixes e ovos',[]],['bife','Carnes, peixes e ovos',[]],['carne','Carnes, peixes e ovos',[]],['ovo','Carnes, peixes e ovos',[]],['peixe','Carnes, peixes e ovos',[]],['salmão','Carnes, peixes e ovos',[]],['atum','Carnes, peixes e ovos',[]],
['feijão','Leguminosas',['Leguminosas']],['lentilha','Leguminosas',['Leguminosas']],['grão de bico','Leguminosas',['Leguminosas']],['ervilha','Leguminosas',['Leguminosas']],
['brócolis','Frutas e vegetais',[]],['brocolis','Frutas e vegetais',[]],['alface','Frutas e vegetais',[]],['tomate','Frutas e vegetais',[]],['cenoura','Frutas e vegetais',[]],['abobrinha','Frutas e vegetais',[]],['pepino','Frutas e vegetais',[]],['salada','Frutas e vegetais',[]],['banana','Frutas e vegetais',[]],['maçã','Frutas e vegetais',[]],['mamão','Frutas e vegetais',[]],['laranja','Frutas e vegetais',[]],['morango','Frutas e vegetais',[]],['melancia','Frutas e vegetais',[]],
['iogurte','Laticínios',['Lactose']],['leite','Laticínios',['Lactose']],['queijo','Laticínios',['Lactose']],['requeijão','Laticínios',['Lactose']],['manteiga','Laticínios',[]],
['café','Bebidas',['Cafeína']],['chá preto','Bebidas',['Cafeína']],['chá verde','Bebidas',['Cafeína']],['chá','Bebidas',[]],['suco','Bebidas',[]],['água','Bebidas',[]],['refrigerante','Bebidas',[]],['coca zero','Bebidas',['Cafeína','Adoçantes']],['coca-cola','Bebidas',['Cafeína']],['cerveja','Bebidas',['Álcool']],['vinho','Bebidas',['Álcool']],
['pizza','Refeição mista',['Trigo/glúten']],['hambúrguer','Refeição mista',[]],['lasanha','Refeição mista',['Trigo/glúten']],['panqueca','Refeição mista',[]],['fritura','Outro',['Fritura']]];
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const local=()=>{let d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const pretty=s=>new Date(s).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const elt=(tag,cl='',txt)=>{let e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e};
const toast=s=>{let e=$('#toast');e.textContent=s;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3500)};
function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function read(){return new Promise((ok,no)=>{let r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>ok(r.result.sort((a,b)=>b.datetime.localeCompare(a.datetime)));r.onerror=()=>no(r.error)})}
function save(list){return new Promise((ok,no)=>{let t=db.transaction(STORE,'readwrite');for(let x of list)t.objectStore(STORE).put(x);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function del(id){return new Promise((ok,no)=>{let t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function clear(){return new Promise((ok,no)=>{let t=db.transaction(STORE,'readwrite');t.objectStore(STORE).clear();t.oncomplete=ok;t.onerror=()=>no(t.error)})}
const vals=(selector)=>$$(selector).filter(x=>x.checked).map(x=>x.value);
function checks(target,options){let root=$(target);root.replaceChildren();options.forEach(x=>{let l=elt('label'),c=elt('input');c.type='checkbox';c.value=x;l.append(c,document.createTextNode(x));root.append(l)})}
function setChecks(selector,list){$$(selector).forEach(x=>x.checked=(list||[]).includes(x.value))}
function classify(text){let found=[];for(let [name,category,tags] of catalog){if(norm(text).includes(norm(name))&&!found.some(x=>norm(x.name)===norm(name)))found.push({name,category,tags})}return found.filter(x=>!found.some(y=>y!==x&&norm(y.name).includes(norm(x.name))))}
function updateDetected(){const root=$('#detected');root.replaceChildren();if(!items.length)root.append(elt('p','muted tiny','Nenhum alimento identificado; edite a descrição ou adicione manualmente.'));items.forEach((it,i)=>{let chip=elt('div','chip');let title=elt('span','',`${it.name} · ${it.category}`),b=elt('button','chipRemove','×');b.type='button';b.setAttribute('aria-label','Remover '+it.name);b.onclick=()=>{items.splice(i,1);updateDetected()};chip.append(title,b);root.append(chip)})}
function classifyNow(){items=classify($('#foodText').value);let tags=[...new Set(items.flatMap(x=>x.tags||[]))];setChecks('#markers input',tags);updateDetected();toast(`${items.length} alimentos identificados; revise antes de salvar.`)}
function photoConvert(f){return new Promise((ok,no)=>{if(!f)return ok(null);if(f.size>12e6)return no(Error('Foto deve ter menos de 12 MB.'));let u=URL.createObjectURL(f),im=new Image();im.onload=()=>{let c=document.createElement('canvas'),scale=Math.min(1,800/Math.max(im.width,im.height));c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.65))};im.onerror=()=>{URL.revokeObjectURL(u);no(Error('Foto inválida'))};im.src=u})}
// v24: CLIP experimental com múltiplos recortes e confirmação explícita.
// O banco de dados e o formato do backup continuam idênticos à v23.
let photoModelPromise=null,photoAnalysisEpoch=0;
const photoLabels=[
 ['Arroz branco','cooked white rice'],['Arroz integral','cooked brown rice'],['Feijão','cooked Brazilian pinto beans'],['Feijão preto','cooked black beans'],['Bife grelhado','grilled beef steak'],['Carne moída','cooked ground beef'],['Frango','cooked chicken'],['Peixe','cooked fish'],['Ovo','cooked egg'],['Batata frita','french fries'],['Batata cozida','boiled potatoes'],['Purê de batata','mashed potatoes'],['Cebola','onion rings'],['Alface','green lettuce leaves'],['Tomate','sliced tomatoes'],['Brócolis','steamed broccoli'],['Cenoura','carrots'],['Macarrão','cooked pasta noodles'],['Queijo','cheese'],['Farofa','Brazilian toasted cassava flour farofa'],['Pão','bread'],['Banana','banana'],['Linguiça','grilled sausage'],['Salada de folhas','green leafy salad'],['Abobrinha','cooked zucchini'],['Mandioca','cassava root'],['Milho','corn kernels'],['Lentilha','cooked lentils']
];
const photoAreas=[
 ['Prato inteiro',0,0,1,1],
 ['Superior esquerdo',0,0,.55,.55],['Superior direito',.45,0,.55,.55],
 ['Centro esquerdo',0,.23,.55,.54],['Centro',.225,.225,.55,.55],['Centro direito',.45,.23,.55,.54],
 ['Inferior esquerdo',0,.45,.55,.55],['Inferior centro',.225,.45,.55,.55],['Inferior direito',.45,.45,.55,.55],
 ['Detalhe sup. esquerdo',0,0,.36,.36],['Detalhe sup. centro',.32,0,.36,.36],['Detalhe sup. direito',.64,0,.36,.36],
 ['Detalhe centro esquerdo',0,.32,.36,.36],['Detalhe central',.32,.32,.36,.36],['Detalhe centro direito',.64,.32,.36,.36],
 ['Detalhe inf. esquerdo',0,.64,.36,.36],['Detalhe inf. centro',.32,.64,.36,.36],['Detalhe inf. direito',.64,.64,.36,.36]
];
function photoStatus(msg){const e=$('#recognizePhotoStatus');if(e)e.textContent=msg}
function photoUIReset(){photoAnalysisEpoch++;let btn=$('#recognizePhotoBtn');if(btn)btn.disabled=!photo;let root=$('#photoSuggestions');if(root)root.replaceChildren();photoStatus(photo?'Foto pronta para análise.':'Selecione uma foto para habilitar a análise.')}
async function getPhotoModel(){
 if(!photoModelPromise){photoModelPromise=(async()=>{
  const mod=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
  mod.env.allowLocalModels=false;
  return mod.pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{device:'wasm'});
 })().catch(err=>{photoModelPromise=null;throw err});}
 return photoModelPromise;
}
function photoCrop(img,x,y,w,h){
 const c=document.createElement('canvas');c.width=224;c.height=224;
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,224,224);
 ctx.drawImage(img,img.naturalWidth*x,img.naturalHeight*y,img.naturalWidth*w,img.naturalHeight*h,0,0,224,224);
 return c.toDataURL('image/jpeg',.83);
}
function approvedPhotoFood(name){let known=classify(name).find(x=>norm(x.name)===norm(name));return known||{name,category:'Outro',tags:[]}}
function addConfirmedPhotoFoods(names){
 const added=[];
 for(const name of names){if(!items.some(x=>norm(x.name)===norm(name))){items.push(approvedPhotoFood(name));added.push(name)}}
 updateDetected();
 // Descrição é obrigatória; não elimina o texto preexistente ou o histórico.
 const field=$('#foodText'),existing=norm(field.value);
 const missing=added.filter(name=>!existing.includes(norm(name)));
 if(missing.length)field.value=(field.value.trim()?field.value.trim().replace(/[,;.\s]+$/,'')+', ':'')+missing.join(', ');
 toast(added.length?`${added.length} alimento(s) confirmado(s). Revise a descrição antes de salvar.`:'Nenhum alimento novo adicionado.');
}
async function recognizePhoto(){
 if(!photo){photoStatus('Selecione uma foto primeiro.');return}
 const epoch=++photoAnalysisEpoch,button=$('#recognizePhotoBtn'),root=$('#photoSuggestions');
 button.disabled=true;root.replaceChildren();photoStatus('Preparando análise… Na primeira vez pode demorar um pouco.');
 try{
  const img=$('#preview');if(!img.complete||!img.naturalWidth)throw Error('A foto ainda não está pronta.');
  const model=await getPhotoModel();if(epoch!==photoAnalysisEpoch)return;
  const prompts=photoLabels.map(x=>'a close-up photograph of '+x[1]);
  const scores=new Map();
  for(let i=0;i<photoAreas.length;i++){
   if(epoch!==photoAnalysisEpoch)return;
   const [region,x,y,w,h]=photoAreas[i];photoStatus(`Analisando foto… ${Math.round((i+1)/photoAreas.length*100)}%`);
   const preds=await model(photoCrop(img,x,y,w,h),prompts,{topk:5});
   if(!Array.isArray(preds))throw Error('O modelo retornou um resultado inesperado.');
   for(const pred of preds.slice(0,3)){
    const j=prompts.indexOf(pred.label);if(j<0)continue;
    const name=photoLabels[j][0],entry=scores.get(name)||{regions:0,score:0};
    entry.regions++;entry.score+=Math.max(0,Number(pred.score)||0);scores.set(name,entry);
   }
  }
  if(epoch!==photoAnalysisEpoch)return;
  const ranked=[...scores].sort((a,b)=>b[1].regions-a[1].regions||b[1].score-a[1].score).slice(0,16);
  if(!ranked.length){photoStatus('Nenhuma sugestão encontrada. Digite os alimentos manualmente.');return}
  const info=elt('p','muted tiny','Selecione os alimentos presentes no prato.');root.append(info);
  const choices=elt('div','photoChoices');
  for(const [name,data] of ranked){const label=elt('label','photoChoice'),check=elt('input'),caption=elt('span','',name);check.type='checkbox';check.value=name;label.append(check,caption);choices.append(label)}
  root.append(choices);
  const manual=elt('div','photoManual'),sel=elt('select');sel.setAttribute('aria-label','Incluir alimento não reconhecido');const empty=elt('option','','Adicionar alimento que faltou…');empty.value='';sel.append(empty);
  for(const [name] of photoLabels){const opt=elt('option','',name);opt.value=name;sel.append(opt)}
  const add=elt('button','secondary','Adicionar');add.type='button';add.onclick=()=>{const name=sel.value;if(!name)return;let check=[...choices.querySelectorAll('input')].find(x=>x.value===name);if(!check){let label=elt('label','photoChoice');check=elt('input');check.type='checkbox';check.value=name;label.append(check,elt('span','',name));choices.append(label)}check.checked=true;sel.value=''};
  manual.append(sel,add);root.append(manual);
  const apply=elt('button','','Usar alimentos selecionados');apply.type='button';apply.onclick=()=>{const selected=[...choices.querySelectorAll('input:checked')].map(x=>x.value);if(!selected.length){photoStatus('Marque pelo menos um alimento confirmado antes de adicionar.');return}addConfirmedPhotoFoods(selected);apply.disabled=true;apply.textContent='Alimentos incluídos';photoStatus('Alimentos incluídos. Confira antes de salvar.')};root.append(apply);
  photoStatus('Confira as sugestões e adicione o que estiver faltando.');
 }catch(err){if(epoch===photoAnalysisEpoch)photoStatus('Não foi possível analisar: '+(err?.message||String(err))+'. É possível registrar a refeição manualmente.')}finally{if(epoch===photoAnalysisEpoch)button.disabled=!photo}
}
function resetForm(form){form.reset();form.elements.editId.value='';if(form.elements.datetime)form.elements.datetime.value=local();if(form.elements.date)form.elements.date.value=local().slice(0,10);photo=null;$('#preview').hidden=true;$('#removePhoto').hidden=true;photoUIReset();items=[];updateDetected();$('#intensityLabel').textContent='3';$('#urgencyLabel').textContent='0';$('#stressLabel').textContent='3'}
function tab(name){trackNavigation(name);$$('.page').forEach(e=>e.classList.toggle('active',e.id===name));$$('nav button').forEach(e=>e.classList.toggle('selected',e.dataset.tab===name));if(name==='analises')analytics();if(name==='historico')renderHistory();if(name==='dados'){$('#dataCountSummary').textContent=`${window.entries.length.toLocaleString('pt-BR')} registros armazenados neste dispositivo`;$('#countLabel').textContent=`${window.entries.length} registros armazenados`;renderBackupStatus();}window.scrollTo(0,0)}
async function refresh(){window.entries=await read();let es=window.entries,day=local().slice(0,10),tod=es.filter(x=>x.datetime.slice(0,10)===day);let cells=[['Refeições',tod.filter(x=>x.kind==='food').length],['Evacuações',tod.filter(x=>x.kind==='bowel').length],['Sintomas',tod.filter(x=>x.kind==='symptom').length],['Registros',es.length]];$('#stats').replaceChildren(...cells.map(([n,v])=>{let c=elt('div','stat');c.append(elt('span','',n),elt('strong','',v));return c}));let recent=$('#recent');recent.replaceChildren();if(!es.length)recent.append(elt('p','muted','Sem registros. Crie um registro de teste para começar.'));renderBackupStatus();for(let e of es.slice(0,90)){let d=elt('article','item'),h=elt('div','itemHeader');let title=e.kind==='food'?'🍽 '+e.meal:e.kind==='bowel'?'🚽 Evacuação':e.kind==='context'?'🗓 Contexto':'♡ Sintomas';h.append(elt('strong','',title),elt('small','',pretty(e.datetime)));d.append(h);let summary=e.kind==='food'?e.description:e.kind==='bowel'?`Bristol ${e.bristol||'não informado'} · Sangue: ${e.blood||'não informado'} · Urgência: ${e.urgency||0}/10`:e.kind==='context'?`Estresse ${e.stress}/10 · Sono ${e.sleep||'não informado'} h`:`${(e.symptoms||[e.symptom].filter(Boolean)).join(', ')} · Intensidade ${e.intensity}/10`;d.append(elt('p','',summary));if(e.kind==='food'&&e.foods?.length)d.append(elt('small','',e.foods.map(x=>x.name).join(' • ')));if(e.photo){let im=elt('img');im.src=e.photo;im.alt='Foto da refeição';d.append(im)}if(e.notes)d.append(elt('p','muted',e.notes));let buttons=elt('div','entryActions'),edit=elt('button','secondary','Editar'),remove=elt('button','danger','Excluir');edit.onclick=()=>editRecord(e);remove.onclick=async()=>{if(confirm('Excluir este registro?')){await del(e.id);await refresh()}};buttons.append(edit,remove);d.append(buttons);recent.append(d)}}
function editRecord(e){let name=({food:'refeicao',symptom:'sintoma',bowel:'evacuacao',context:'contexto'})[e.kind];if(!name)return;let form=$('#'+({food:'foodForm',symptom:'symptomForm',bowel:'bowelForm',context:'contextForm'})[e.kind]);resetForm(form);form.elements.editId.value=e.id;form.elements.datetime&&(form.elements.datetime.value=e.datetime);if(e.kind==='food'){form.elements.meal.value=e.meal;form.elements.description.value=e.description;form.elements.notes.value=e.notes||'';items=e.foods||classify(e.description);updateDetected();setChecks('#markers input',e.markers);photo=e.photo||null;if(photo){$('#preview').src=photo;$('#preview').hidden=false;$('#removePhoto').hidden=false;photoUIReset()}}if(e.kind==='symptom'){setChecks('#symptomChoices input',e.symptoms||[e.symptom]);form.elements.intensity.value=e.intensity;$('#intensityLabel').textContent=e.intensity;form.elements.notes.value=e.notes||''}if(e.kind==='bowel'){let r=form.querySelector(`input[name="bristol"][value="${e.bristol}"]`);if(r)r.checked=true;['blood','mucus','urgency','incomplete','notes'].forEach(k=>{if(e[k]!==undefined)form.elements[k].value=e[k]});$('#urgencyLabel').textContent=e.urgency||0}if(e.kind==='context'){form.elements.date.value=e.date||e.datetime.slice(0,10);['stress','sleep','meds','activity','notes'].forEach(k=>{if(e[k]!==undefined)form.elements[k].value=e[k]});setChecks('#contextChoices input',e.factors);$('#stressLabel').textContent=e.stress}tab(name);toast('Editando registro; salve as alterações.')}
function bristolUI(){let labels=['Bolinhas duras','Grumos duros','Com fissuras','Lisa e macia','Pedaços macios','Pastosa','Líquida'];let shapes=['● ● ●','●● ●●','▰ ≋','━━━━','● ●●','≈≈≋','〰〰'];let root=$('#bristolChoices');labels.forEach((t,i)=>{let l=elt('label','bristolCard');let r=elt('input');r.type='radio';r.name='bristol';r.value=i+1;if(i===3)r.checked=true;l.append(r,elt('span','stool',shapes[i]),elt('b','',`${i+1}`),elt('small','',t));root.append(l)})}
function bars(target,counts){let root=$(target);root.replaceChildren();let sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);if(!sorted.length){root.append(elt('p','muted','Ainda não há dados suficientes.'));return}let max=Math.max(...sorted.map(x=>x[1]),1);for(let [name,n] of sorted.slice(0,12)){let row=elt('div','categoryRow'),track=elt('div','track'),fill=elt('div','fill');fill.style.width=(n/max*100)+'%';track.append(fill);row.append(elt('span','',name),track,elt('b','',n));root.append(row)}}
function analytics(){
 const es=Array.isArray(window.entries)?window.entries:[];
 const mode=$('#analysisPeriod')?.value||'all';
 const today=local().slice(0,10);
 const cutoff=mode==='all'||mode==='custom'?null:(()=>{let d=new Date(today+'T12:00:00');d.setDate(d.getDate()-Number(mode)+1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const from=mode==='custom'?$('#analysisFrom').value:cutoff,to=mode==='custom'?$('#analysisTo').value:today;
 const selected=es.filter(x=>{let day=String(x?.datetime||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(day)&&(!from||day>=from)&&(!to||day<=to)});
 const food=selected.filter(x=>x.kind==='food'),sym=selected.filter(x=>x.kind==='symptom'),bowel=selected.filter(x=>x.kind==='bowel');
 $('#analysisCustom').hidden=mode!=='custom';
 const dates=selected.map(x=>x.datetime.slice(0,10)).sort();
 $('#analysisPeriodInfo').textContent=selected.length?`${selected.length.toLocaleString('pt-BR')} registros · de ${dates[0]} até ${dates[dates.length-1]} · ${new Set(dates).size} dias com registro`:'Nenhum registro no período selecionado.';
 $('#analysisStats').replaceChildren(...[['Refeições/anotações',food.length],['Evacuações',bowel.length],['Sintomas registrados',sym.length],['Dias com registros',new Set(dates).size]].map(([n,v])=>{let d=elt('div','stat');d.append(elt('span','',n),elt('strong','',v.toLocaleString('pt-BR')));return d}));
 // Render independently so one malformed entry or chart cannot blank the other charts.
 const safe=(target,run)=>{const root=$(target);if(!root)return;try{run(root)}catch(error){console.error('Check-In gráfico:',target,error);root.replaceChildren(elt('p','muted','Não foi possível montar este gráfico. Os registros permanecem intactos.'))}};
 const count=(obj,key)=>{let k=String(key||'Não classificado');obj[k]=(obj[k]||0)+1};
 const fc={},cats={};
 safe('#topFoods',()=>{
   for(const f of food){try{let list=Array.isArray(f.foods)&&f.foods.length?f.foods:classify(String(f.description||f.sourceText||''));if(!Array.isArray(list))continue;for(const item of list){if(!item||typeof item!=='object'||!item.name)continue;count(fc,item.name);count(cats,item.category||'Não classificado')}}catch(error){console.warn('Registro alimentar ignorado no gráfico',f?.id,error)}}
   bars('#topFoods',fc);
 });
 safe('#categoryGraph',()=>bars('#categoryGraph',cats));
 safe('#symptomGraph',()=>{const sc={};for(const s of sym){const names=Array.isArray(s.symptoms)&&s.symptoms.length?s.symptoms:[s.symptom||'Não classificado'];for(const name of names)count(sc,name==='Outro'&&s.sourceUID?'Não classificado (texto livre)':name)}bars('#symptomGraph',sc)});
 let blood=0,mucus=0;
 safe('#bristolGraph',()=>{const br={};for(const b of bowel){const type=Number(b.bristol);if(Number.isInteger(type)&&type>=1&&type<=7)count(br,'Tipo '+type);const raw=String(b.sourceText||b.notes||'').toLowerCase();if(/sangue/.test(raw)||(!b.sourceUID&&b.blood&&!['Ausente','Não observado'].includes(b.blood)))blood++;if(/muco/.test(raw)||(!b.sourceUID&&b.mucus==='Sim'))mucus++}bars('#bristolGraph',br)});
 $('#bowelNotes').textContent=`Menções de sangue: ${blood} · Menções de muco: ${mucus}. Contagem de registros, não de episódios confirmados.`;
 safe('#graph',root=>{
   root.replaceChildren();const months=Object.create(null);
   for(const entry of selected){const month=String(entry.datetime).slice(0,7);if(!/^\d{4}-\d{2}$/.test(month))continue;if(!months[month])months[month]={food:0,symptom:0,bowel:0};if(['food','symptom','bowel'].includes(entry.kind))months[month][entry.kind]++}
   const labels=Object.keys(months).sort();$('#analysisTrendCaption').textContent='Total de registros por mês. Passe o cursor/toque nas barras para consultar os valores.';
   if(!labels.length){root.append(elt('p','muted','Sem registros no período.'));return}
   root.style.overflowX='auto';root.style.justifyContent='flex-start';
   for(const month of labels){const col=elt('div','graphDay'),stack=elt('div','barStack');col.style.minWidth='35px';for(const kind of ['food','symptom','bowel']){const n=months[month][kind];const bar=elt('div','bar '+kind);bar.style.height=Math.min(180,Math.max(0,n*2))+'px';bar.title=`${month}: ${n} ${kind}`;stack.append(bar)}col.append(stack,elt('small','',month.slice(2).replace('-','/')));root.append(col)}
 });
 safe('#associationGraph',root=>{
   root.replaceChildren();const timestampedFood=food.filter(x=>!x.timeUnknown),timestampedSymptoms=sym.filter(x=>!x.timeUnknown);
   root.append(elt('p','muted',timestampedFood.length<3||!timestampedSymptoms.length?`Não há horários confirmados suficientes para comparar sintomas após refeições. Refeições com horário conhecido: ${timestampedFood.length}; sintomas com horário conhecido: ${timestampedSymptoms.length}.`:'Existem dados com horário conhecido, mas as comparações precisam de validação adicional. O aplicativo não classifica alimentos como causadores de sintomas.'));
 });
}
function b64(a){let s='',v=new Uint8Array(a);for(let i=0;i<v.length;i+=8192)s+=String.fromCharCode(...v.subarray(i,i+8192));return btoa(s)}
function un64(s){let b=atob(s),v=new Uint8Array(b.length);for(let i=0;i<b.length;i++)v[i]=b.charCodeAt(i);return v}
async function key(pass,salt){let base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function exportBackup(){
 let pass=$('#exportPassword').value;
 if(pass.length<12)return toast('A senha precisa ter pelo menos 12 caracteres.');
 let snapshot=await read(),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 let data=new TextEncoder().encode(JSON.stringify({app:'MeuDiarioIntestinal',schema:1,exportedAt:new Date().toISOString(),entries:snapshot}));
 let secret=await key(pass,salt),enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},secret,data);
 let test=await crypto.subtle.decrypt({name:'AES-GCM',iv},secret,enc);
 let check=JSON.parse(new TextDecoder().decode(test));
 if(check.app!=='MeuDiarioIntestinal'||check.entries.length!==snapshot.length||check.entries.some((e,i)=>e.id!==snapshot[i].id))throw Error('Falha na verificação interna do backup');
 let blob=new Blob([JSON.stringify({format:'MDI-AESGCM-1',salt:b64(salt),iv:b64(iv),data:b64(enc)})],{type:'application/octet-stream'});
 let url=URL.createObjectURL(blob),a=elt('a');a.href=url;a.download=`meu-diario-${local().slice(0,10)}.mdi`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 $('#exportPassword').value='';setBackupMeta({...backupMeta(),pendingAt:new Date().toISOString()});toast('Backup verificado. Salve o .mdi em Arquivos e confirme depois.');
}
async function importBackup(){let f=$('#importFile').files[0],pass=$('#importPassword').value;if(!f||!pass)throw Error('Selecione arquivo e senha');if(f.size>50*1024*1024)throw Error('Arquivo grande demais');let b=JSON.parse(await f.text());if(b.format!=='MDI-AESGCM-1')throw Error('Formato não reconhecido');let plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(b.iv)},await key(pass,un64(b.salt)),un64(b.data))}catch{throw Error('Senha incorreta ou backup danificado')}let data=JSON.parse(new TextDecoder().decode(plain));if(data.app!=='MeuDiarioIntestinal'||data.schema!==1||!Array.isArray(data.entries)||data.entries.some(e=>!e.id||!['food','symptom','bowel','context'].includes(e.kind)||typeof e.datetime!=='string'))throw Error('Registros inválidos');if(confirm(`Importar ${data.entries.length} registros? Registros com mesmo ID serão atualizados.`)){await save(data.entries);await refresh();toast('Backup importado.') }}

// Importação local de eventos .ics: todo evento precisa ser revisado e selecionado.
let calendarCandidates=[];
function unfoldICS(raw){return raw.replace(/\r\n[ \t]|\n[ \t]/g,'').split(/\r?\n/)}
function unescapeICS(v){return (v||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\')}
function icsDatetime(v){if(!v)return null;let z=v.endsWith('Z'),m=v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?/);if(!m)return null;
 if(z){let d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+(m[4]||12),+(m[5]||0),+(m[6]||0)));return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
 return `${m[1]}-${m[2]}-${m[3]}T${m[4]||'12'}:${m[5]||'00'}`}
function parseICS(raw){let rows=[],event=null;for(let line of unfoldICS(raw)){if(line==='BEGIN:VEVENT'){event={};continue}if(line==='END:VEVENT'){if(event?.DTSTART)rows.push(event);event=null;continue}if(!event)continue;let idx=line.indexOf(':');if(idx<0)continue;let field=line.slice(0,idx).split(';')[0].toUpperCase();if(['SUMMARY','DESCRIPTION','DTSTART','UID','RECURRENCE-ID'].includes(field))event[field]=unescapeICS(line.slice(idx+1))}return rows}
function calendarLabel(e){return [e.SUMMARY,e.DESCRIPTION].filter(Boolean).join(' — ').trim().slice(0,8000)}
function previewCalendar(){let host=$('#calendarPreview');host.replaceChildren();$('#calendarCount').textContent=`${calendarCandidates.length} eventos encontrados. Nenhum é importado sem seleção.`;
 for(let i=0;i<Math.min(calendarCandidates.length,500);i++){let e=calendarCandidates[i],r=elt('div','calendarRow'),check=elt('input');check.type='checkbox';check.setAttribute('aria-label','Selecionar evento '+(i+1));e.check=check;
 let sel=elt('select');sel.setAttribute('aria-label','Tipo do evento');[['food','Alimentação'],['symptom','Sintoma (revisar depois)']].forEach(([v,t])=>{let o=elt('option','',t);o.value=v;sel.append(o)});e.select=sel;
 let detail=elt('div',''),bold=elt('strong','',e.datetime?pretty(e.datetime):'Sem data'),txt=elt('p','muted tiny',e.text);detail.append(bold,txt);r.append(check,detail,sel);host.append(r)}
 if(calendarCandidates.length>500)host.append(elt('p','warning','Exibidos somente os primeiros 500 eventos. Separe o calendário em arquivos menores ou revise os registros em lotes.'))}
async function calendarFileChange(){let f=$('#calendarFile').files[0];calendarCandidates=[];$('#calendarPreview').replaceChildren();$('#calendarCount').textContent='';if(!f)return;if(f.size>8*1024*1024)throw Error('Arquivo .ics maior que 8 MB; divida em arquivos menores.');let raw=await f.text();if(!raw.includes('BEGIN:VCALENDAR'))throw Error('Este arquivo não parece ser um calendário .ics válido.');calendarCandidates=parseICS(raw).map((e,i)=>({...e,datetime:icsDatetime(e.DTSTART),text:calendarLabel(e),i})).filter(e=>e.datetime&&e.text);previewCalendar()}
async function importCalendar(){let selected=calendarCandidates.slice(0,500).filter(e=>e.check?.checked);if(!selected.length)return toast('Selecione os eventos que deseja importar.');let existing=await read(),ids=new Set(existing.map(e=>e.id));let entries=selected.map(e=>{let id='calendar-'+(e.UID?e.UID+'-'+(e['RECURRENCE-ID']||e.DTSTART):'row-'+e.i+'-'+e.DTSTART);let description=e.text;return e.select.value==='symptom'?{id,kind:'symptom',datetime:e.datetime,symptoms:['Outro'],symptom:'Outro',intensity:0,notes:'IMPORTADO DO CALENDÁRIO — REVISAR: '+description}:{id,kind:'food',datetime:e.datetime,meal:'Outro',description,foods:classify(description),category:'Refeição mista',markers:[],notes:'IMPORTADO DO CALENDÁRIO — REVISAR'};});let fresh=entries.filter(e=>!ids.has(e.id));if(!fresh.length)return toast('Todos os eventos selecionados já foram importados.');if(!confirm(`Importar ${fresh.length} eventos selecionados? Faça backup antes. Registros ambíguos precisarão ser editados.`))return;await save(fresh);await refresh();toast(`${fresh.length} eventos importados. Revise e edite os registros.`)}


// As quatro abas principais têm navegação direta, sem botão Voltar.
// O botão aparece somente nas páginas secundárias abertas a partir delas.
const primaryPages = new Set(['registrar','analises','historico','dados']);
const secondaryPages = new Set(['refeicao','sintoma','evacuacao','contexto']);
let lastPage = 'registrar';
let returnPage = null;
function trackNavigation(name) {
  const previous = lastPage;
  if (name !== previous) {
    if (primaryPages.has(name)) {
      returnPage = null;
    } else if (secondaryPages.has(name) && !window.__checkinBackNavigation) {
      // Conserva o ponto de retorno original ao avançar entre páginas secundárias.
      if (primaryPages.has(previous)) returnPage = previous;
      else if (previous === 'mais' && (name === 'dados' || name === 'instrucoes')) returnPage = 'mais';
      else if (!returnPage) returnPage = 'registrar';
    }
    lastPage = name;
  }
  const button = document.getElementById('backButton');
  if (button) button.hidden = !secondaryPages.has(name) || !returnPage;
}
function goBack() {
  if (!returnPage) return;
  const to = returnPage;
  window.__checkinBackNavigation = true;
  try {
    returnPage = null;
    tab(to);
  } finally {
    window.__checkinBackNavigation = false;
  }
}
let calendarMonth=(new Date()).getFullYear()*12+(new Date()).getMonth();
function setCalendarMonth(dateStr){if(/^\d{4}-\d{2}/.test(dateStr)){const [y,m]=dateStr.split('-').map(Number);calendarMonth=y*12+m-1}}
function renderMonth(){
 const y=Math.floor(calendarMonth/12),m=calendarMonth%12;
 document.getElementById('monthTitle').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const container=document.getElementById('monthDays');container.replaceChildren();
 const start=(new Date(y,m,1).getDay()+6)%7,limit=new Date(y,m+1,0).getDate();
 const byDate=new Map();for(const e of window.entries||[]){const day=(e.datetime||'').slice(0,10);if(!day)continue;if(!byDate.has(day))byDate.set(day,new Set());byDate.get(day).add(e.kind)}
 for(let i=0;i<start;i++){const spacer=document.createElement('span');spacer.className='dayEmpty';container.append(spacer)}
 const selected=document.getElementById('historyDate').value;
 for(let d=1;d<=limit;d++){
  const day=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const b=document.createElement('button');b.type='button';b.className='calendarDay';b.setAttribute('aria-label',`${d} de ${document.getElementById('monthTitle').textContent}`);b.setAttribute('aria-pressed',String(day===selected));
  if(day===selected)b.classList.add('chosen');if(day===new Date().toLocaleDateString('en-CA'))b.classList.add('today');
  const number=document.createElement('span');number.textContent=d;b.append(number);
  const dots=document.createElement('span');dots.className='dayDots';for(const kind of ['food','symptom','bowel','context'])if(byDate.get(day)?.has(kind)){const dot=document.createElement('i');dot.className='dot-'+kind;dots.append(dot)}b.append(dots);
  b.onclick=()=>{document.getElementById('historyDate').value=day;renderHistory();document.getElementById('historyResults').scrollIntoView({behavior:'smooth',block:'start'})};container.append(b)
 }
}
function renderHistory(){
 renderMonth();
 const date=$('#historyDate').value,query=norm($('#historySearch').value.trim());let subset=(window.entries||[]).filter(e=>(!date||e.datetime.slice(0,10)===date)&&(!query||norm([e.description,e.notes,e.meds,e.meal,(e.symptoms||[]).join(' ')].join(' ')).includes(query)));
 $('#historyCount').textContent=`${subset.length} registros encontrados; mostrando até 150 por vez.`;
 const root=$('#historyResults');root.replaceChildren();for(const e of subset.slice(0,150)){
  const box=elt('article','item'),title=e.kind==='food'?'Alimentação · '+(e.meal||'Outro'):e.kind==='bowel'?'Evacuação':e.kind==='context'?'Contexto': 'Sintomas / observação';
  box.append(elt('strong','',title+' — '+e.datetime.slice(0,10)+(e.timeUnknown?' · horário não informado':' · '+e.datetime.slice(11,16))));
  box.append(elt('p','',e.description||e.notes||e.meds||''));
  if(e.kind==='bowel'&&e.bristol)box.append(elt('small','',`Bristol ${e.bristol}`));
  if(e.importedOriginalTitle)box.append(elt('small','muted','Título original: '+e.importedOriginalTitle));
  let actions=elt('div','entryActions'),edit=elt('button','secondary','Editar'),remove=elt('button','danger','Excluir');edit.onclick=()=>editRecord(e);remove.onclick=async()=>{if(confirm('Excluir este registro?')){await del(e.id);await refresh();renderHistory()}};actions.append(edit,remove);box.append(actions);root.append(box);
 }
}
async function importStructured(){
 const f=$('#structuredFile').files[0];if(!f)throw Error('Selecione o arquivo historico_estruturado.json');if(f.size>25*1024*1024)throw Error('Arquivo excede 25 MB');
 const data=JSON.parse(await f.text());if(data.version!=='checkin-preparacao-1'||!Array.isArray(data.records)||data.records.length>15000)throw Error('Formato inesperado do histórico');
 const kinds={alimentacao:'food',evacuacao:'bowel',sintoma:'symptom',contexto:'context',revisar:'context'};
 const rows=data.records.map(r=>{
  if(!r.id||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!(r.type in kinds)||typeof r.text!=='string')throw Error('Registro inválido no arquivo');
  const at=r.time&&/^\d{2}:\d{2}$/.test(r.time)?r.time:'12:00';
  const base={id:'checkin-historico-'+r.id,datetime:r.date+'T'+at,timeUnknown:!r.time,kind:kinds[r.type],sourceUID:r.source_uid,sourceText:r.text,importedOriginalTitle:r.original_event_title||'',importedReview:r.review||''};
  if(base.kind==='food')return {...base,meal:r.subtype||'Outro',description:r.text,foods:classify(r.text),markers:[],notes:r.review?'Revisão: '+r.review:''};
  if(base.kind==='bowel'){let m=(r.bristol_text||'').match(/[1-7]/);return {...base,bristol:m&& !/[–\-\/]/.test(r.bristol_text||'')?Number(m[0]):null,blood:/sangue/i.test(r.text)?'Não observado':'Não informado',mucus:/muco/i.test(r.text)?'Sim':'Não observado',urgency:0,notes:r.text+(r.review?' | Revisão: '+r.review:'')};}
  if(base.kind==='symptom')return {...base,symptoms:['Outro'],symptom:'Outro',intensity:0,notes:r.text+(r.review?' | Revisão: '+r.review:'')};
  return {...base,stress:0,sleep:'',meds:r.type==='context'?r.text:'',factors:[],activity:'',notes:r.type==='revisar'?'REVISAR: '+r.text:r.review||'',date:r.date};
 });
 let existing=await read(),ids=new Set(existing.map(e=>e.id)),fresh=rows.filter(e=>!ids.has(e.id));
 $('#structuredStatus').textContent=`${rows.length} registros no arquivo; ${fresh.length} novos; ${rows.length-fresh.length} já importados.`;
 if(!fresh.length)return toast('O histórico já foi importado.');
 if(!confirm(`Importar ${fresh.length} registros novos? Os textos originais serão preservados em cada registro. Faça um backup antes de usar dados reais.`))return;
 for(let i=0;i<fresh.length;i+=300)await save(fresh.slice(i,i+300));await refresh();$('#historyDate').value='';$('#historySearch').value='';tab('historico');toast('Histórico importado localmente.');
}

async function start(){if(!window.indexedDB||!window.crypto?.subtle)throw Error('Navegador sem acesso seguro ao armazenamento. Abra pelo endereço http://127.0.0.1:8765/index.html');db=await openDB();checks('#markers',markers);checks('#symptomChoices',symptoms);checks('#contextChoices',contextTags);bristolUI();$$('form').forEach(f=>resetForm(f));$$('.cancelEdit').forEach(b=>b.onclick=()=>{resetForm(b.closest('form'));toast('Formulário pronto para novo registro.')});$('#classifyBtn').onclick=classifyNow;$('#addFood').onclick=()=>{let raw=$('#manualFood').value.trim();if(!raw)return;let candidate=classify(raw)[0];items.push({name:raw,category:candidate?.category||'Outro',tags:candidate?.tags||[]});updateDetected();$('#manualFood').value=''};$('#foodText').addEventListener('blur',()=>{if(!items.length&&$('#foodText').value.trim())classifyNow()});const onPhotoPicked=async e=>{const file=e.target.files?.[0];if(!file)return;try{const converted=await photoConvert(file);photo=converted;$('#preview').src=photo||'';$('#preview').hidden=!photo;$('#removePhoto').hidden=!photo;photoUIReset()}catch(err){toast(err.message)}};$('#foodPhoto').onchange=onPhotoPicked;$('#galleryPhoto').onchange=onPhotoPicked;$('#removePhoto').onclick=()=>{photo=null;$('#preview').hidden=true;$('#removePhoto').hidden=true;$('#foodPhoto').value='';$('#galleryPhoto').value='';photoUIReset()};$('#recognizePhotoBtn').onclick=recognizePhoto;
for(let [id,inp,out] of [['symptomForm','intensity','intensityLabel'],['bowelForm','urgency','urgencyLabel'],['contextForm','stress','stressLabel']])$('#'+id).elements[inp].oninput=e=>$('#'+out).textContent=e.target.value;
$('#foodForm').onsubmit=async ev=>{ev.preventDefault();let f=ev.target,v=new FormData(f),desc=v.get('description').trim();if(!desc)return;if(!items.length)items=classify(desc);let tags=vals('#markers input');await save([{id:v.get('editId')||crypto.randomUUID(),kind:'food',datetime:v.get('datetime'),meal:v.get('meal'),description:desc,foods:structuredClone(items),category:items.length===1?items[0].category:'Refeição mista',markers:tags,notes:(v.get('notes')||'').trim(),photo}]);resetForm(f);await refresh();tab('registrar');toast('Refeição salva.')};
$('#symptomForm').onsubmit=async ev=>{ev.preventDefault();let v=new FormData(ev.target),s=vals('#symptomChoices input');if(!s.length)return toast('Selecione pelo menos um sintoma.');await save([{id:v.get('editId')||crypto.randomUUID(),kind:'symptom',datetime:v.get('datetime'),symptoms:s,symptom:s[0],intensity:Number(v.get('intensity')),notes:v.get('notes')||''}]);resetForm(ev.target);await refresh();tab('registrar');toast('Sintomas salvos.')};
$('#bowelForm').onsubmit=async ev=>{ev.preventDefault();let v=new FormData(ev.target);await save([{id:v.get('editId')||crypto.randomUUID(),kind:'bowel',datetime:v.get('datetime'),bristol:Number(v.get('bristol')),blood:v.get('blood'),mucus:v.get('mucus'),urgency:Number(v.get('urgency')),incomplete:v.get('incomplete'),notes:v.get('notes')||''}]);resetForm(ev.target);await refresh();tab('registrar');toast('Evacuação salva.')};
$('#contextForm').onsubmit=async ev=>{ev.preventDefault();let v=new FormData(ev.target),day=v.get('date');await save([{id:v.get('editId')||crypto.randomUUID(),kind:'context',datetime:day+'T12:00',date:day,stress:Number(v.get('stress')),sleep:v.get('sleep')||'',meds:v.get('meds')||'',factors:vals('#contextChoices input'),activity:v.get('activity')||'',notes:v.get('notes')||''}]);resetForm(ev.target);await refresh();tab('registrar');toast('Contexto salvo.')};
$('#analysisPeriod').onchange=analytics;$('#analysisFrom').onchange=analytics;$('#analysisTo').onchange=analytics;$('#historyDate').onchange=renderHistory;$('#historySearch').oninput=renderHistory;$('#structuredImportBtn').onclick=()=>importStructured().catch(e=>toast(e.message));$('#calendarFile').onchange=()=>calendarFileChange().catch(e=>toast(e.message));$('#calendarImportBtn').onclick=()=>importCalendar().catch(e=>toast(e.message));$('#exportBtn').onclick=()=>exportBackup().catch(e=>toast(e.message));$('#confirmBackupBtn').onclick=()=>{let m=backupMeta();if(!m.pendingAt)return;if(!confirm('Você verificou no app Arquivos que o arquivo .mdi está salvo no iCloud Drive ou em outra mídia segura?'))return;setBackupMeta({confirmedAt:new Date().toISOString(),lastExportAt:m.pendingAt,confirmedCount:window.entries.length});toast('Backup externo confirmado manualmente.');};$('#storageBtn').onclick=persistentStorage;$('#importBtn').onclick=()=>importBackup().catch(e=>toast(e.message));$('#deleteAllBtn').onclick=async()=>{if(prompt('Digite APAGAR para excluir todos os registros deste navegador')==='APAGAR'){await clear();await refresh();toast('Todos os dados locais foram apagados.')}};await refresh();renderBackupStatus();if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{})}

// A navegação não depende da disponibilidade do banco de dados.
function activateNavigation(){
  document.querySelectorAll('nav button[data-tab]').forEach(b=>b.addEventListener('click',()=>{
    try{tab(b.dataset.tab)}catch(e){showAppError('Falha ao abrir '+b.textContent+': '+e.message)}
  }));
  document.querySelectorAll('button[data-go]').forEach(b=>b.addEventListener('click',()=>{
    try{tab(b.dataset.go)}catch(e){showAppError('Falha ao abrir a seção: '+e.message)}
  }));
}
function showAppError(message){
  let e=document.getElementById('appDiagnostic');
  if(!e){e=document.createElement('div');e.id='appDiagnostic';e.style.cssText='padding:14px;margin:12px;border:1px solid #777;background:#29292d;color:#fff;border-radius:10px;white-space:pre-wrap';document.body.prepend(e)}
  e.textContent=message;
}
// A navegação é instalada diretamente pelo HTML de diagnóstico.

start().catch(e=>{showAppError('Não foi possível carregar os registros: '+e.message+'\nAbra pelo endereço http://127.0.0.1:8765/index.html e confira se o Terminal está aberto.');console.error('Erro ao iniciar Check-In',e);});

// Navegação de retorno e calendário, sem acesso a serviços externos.
document.getElementById('backButton').addEventListener('click',goBack);
document.getElementById('monthPrev').addEventListener('click',()=>{calendarMonth--;renderMonth()});
document.getElementById('monthNext').addEventListener('click',()=>{calendarMonth++;renderMonth()});
document.getElementById('historyAll').addEventListener('click',()=>{document.getElementById('historyDate').value='';renderHistory()});
document.getElementById('historyDate').addEventListener('change',()=>{setCalendarMonth(document.getElementById('historyDate').value);renderMonth()});

window.checkinTrack=trackNavigation;
window.checkinOpenPage=tab;
