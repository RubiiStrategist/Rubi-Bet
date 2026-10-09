import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const $ = id => document.getElementById(id);
const config = window.RUBY_CONFIG || {};
const configured = /^https:\/\/[^/]+\.supabase\.co\/?$/.test(config.supabaseUrl||'') && !!config.supabasePublishableKey;
const db = configured ? createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}) : null;
const state = {sites:[],admin:false,user:null,editing:null,selected:null,iconFile:null};
const cleanUrl = x => {try{let u=new URL(x);return u.protocol==='https:' ? u.href : null}catch{return null}};
const domain = x => {try{return new URL(x).hostname}catch{return ''}};
const favicon = s => s.icon_url || 'https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain(s.url))+'&sz=128';
function toast(txt){$('toast').textContent=txt;$('toast').classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.add('hidden'),3500)}
function modal(open){$('modal').classList.toggle('hidden',!open)}
function node(tag,cls,txt){let n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function draw(){let cards=$('cards');cards.replaceChildren();$('heroNumber').textContent=String(state.sites.length).padStart(2,'0');$('total').textContent='· '+state.sites.length;$('accountLabel').textContent=state.admin?'Painel admin':'Administrador';$('add').classList.toggle('hidden',!state.admin);$('signOut').classList.toggle('hidden',!state.user);
 if(!state.sites.length){cards.append(node('div','empty',configured?'Nenhuma plataforma cadastrada ainda.':'Conecte o projeto ao Supabase para carregar as plataformas.'));return}
 state.sites.forEach(s=>{let tile=node('article','tile'+(state.admin?' admin':''));tile.tabIndex=0;tile.role='button';tile.setAttribute('aria-label','Abrir '+s.name);tile.addEventListener('click',()=>openSite(s));tile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSite(s)}});
 let ico=node('span','icon');let im=node('img');im.src=favicon(s);im.alt='';im.loading='lazy';im.onerror=()=>{im.remove();ico.textContent='◆'};ico.append(im);tile.append(ico);
 let arrow=node('span','arrow');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');tile.append(arrow);
 tile.append(node('h3','',s.name),node('span','domain',domain(s.url)));
 if(state.admin){let b=node('button','edit','Editar');b.type='button';b.addEventListener('click',e=>{e.stopPropagation();edit(s)});tile.append(b)}cards.append(tile)});
}
async function load(){if(!db)return;let {data,error}=await db.from('platforms').select('id,name,url,icon_url,sort_order').order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(error){$('loadStatus').textContent='Falha ao carregar plataformas: '+error.message;return}state.sites=data||[];$('loadStatus').textContent='';draw();renderDock()}
async function refreshAuth(){if(!db)return;let {data:{user}}=await db.auth.getUser();state.user=user;state.admin=false;if(user){let {data,error}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();state.admin=!error&&!!data}draw()}
$('account').onclick=()=>{if(!configured){toast('Configure o Supabase primeiro');return}if(state.admin){edit();return}if(state.user){toast('Esta conta não tem permissão de administrador');return}$('authError').textContent='';$('loginView').classList.remove('hidden');$('editForm').classList.add('hidden');modal(true)};
$('signOut').onclick=async()=>{await db.auth.signOut();state.user=null;state.admin=false;draw();toast('Sessão encerrada')};
$('loginForm').onsubmit=async e=>{e.preventDefault();let b=$('loginSubmit');b.disabled=true;$('authError').textContent='';let {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});b.disabled=false;if(error){$('authError').textContent='E-mail ou senha inválidos.';return}await refreshAuth();if(!state.admin){await db.auth.signOut();state.user=null;draw();$('authError').textContent='Conta sem permissão de administrador.';return}$('password').value='';modal(false);toast('Administrador conectado')};
function edit(s=null){if(!state.admin)return;state.editing=s;state.iconFile=null;$('editForm').reset();$('iconPreview').textContent='Ícone automático pelo domínio, caso não envie imagem.';$('editHeading').textContent=s?'Editar plataforma.':'Nova plataforma.';$('deleteSite').classList.toggle('hidden',!s);$('siteName').value=s?.name||'';$('siteUrl').value=s?.url||'';$('sortOrder').value=s?.sort_order??state.sites.length*10;$('editError').textContent='';$('loginView').classList.add('hidden');$('editForm').classList.remove('hidden');modal(true)}
$('add').onclick=()=>edit();$('cancelEdit').onclick=()=>modal(false);$('closeModal').onclick=()=>modal(false);$('modal').onclick=e=>{if(e.target===$('modal'))modal(false)};
$('siteIcon').onchange=e=>{let f=e.target.files?.[0];state.iconFile=null;if(!f)return;if(!['image/png','image/webp','image/jpeg'].includes(f.type)||f.size>1024*1024){$('editError').textContent='Escolha JPG, PNG ou WEBP de até 1 MB.';e.target.value='';return}state.iconFile=f;$('iconPreview').textContent=f.name};
$('editForm').onsubmit=async e=>{e.preventDefault();if(!state.admin)return;const b=$('saveSite');b.disabled=true;$('editError').textContent='';try{let link=cleanUrl($('siteUrl').value);if(!link)throw Error('Use um endereço HTTPS válido.');let values={name:$('siteName').value.trim(),url:link,sort_order:Number($('sortOrder').value)};if(!values.name)throw Error('Informe o nome da plataforma.');
 if(state.iconFile){let f=state.iconFile,ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg',path=crypto.randomUUID()+'.'+ext;let {error}=await db.storage.from('platform-icons').upload(path,f,{contentType:f.type,upsert:false});if(error)throw error;values.icon_url=db.storage.from('platform-icons').getPublicUrl(path).data.publicUrl}
 let q=state.editing?db.from('platforms').update(values).eq('id',state.editing.id):db.from('platforms').insert(values);let {error}=await q;if(error)throw error;modal(false);await load();toast('Plataforma salva para todos os usuários')
 }catch(err){$('editError').textContent=err.message||'Erro ao salvar'}finally{b.disabled=false}};
$('deleteSite').onclick=async()=>{if(!state.admin||!state.editing)return;if(!confirm('Excluir esta plataforma para todos os usuários?'))return;let {error}=await db.from('platforms').delete().eq('id',state.editing.id);if(error){$('editError').textContent=error.message;return}modal(false);await load();toast('Plataforma excluída')};

// A dock recolhe sem afetar a plataforma que está aberta.
// O botão permanece acessível na lateral; deslizar para a esquerda fecha,
// e deslizar para a direita reabre.
let dockCollapsed = false;
function setDockCollapsed(collapsed) {
  dockCollapsed = collapsed;
  $('platformDock').classList.toggle('is-collapsed',collapsed);
  $('dockToggle').setAttribute('aria-expanded',String(!collapsed));
  $('dockToggle').setAttribute('aria-label',collapsed?'Mostrar dock lateral':'Esconder dock lateral');
  $('dockToggle').title = collapsed?'Mostrar plataformas':'Esconder plataformas';
}
$('dockToggle').addEventListener('click',()=>setDockCollapsed(!dockCollapsed));
let gestureStart = null;
for (const target of [$('platformDock'),$('dockToggle')]) {
  target.addEventListener('touchstart',e=>{gestureStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});
  target.addEventListener('touchend',e=>{
    if(!gestureStart)return;
    const dx=e.changedTouches[0].clientX-gestureStart.x;
    const dy=e.changedTouches[0].clientY-gestureStart.y;
    gestureStart=null;
    if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.4){
      setDockCollapsed(dx<0);
    }
  },{passive:true});
}

function renderDock(){
 const items=$('dockItems');items.replaceChildren();
 state.sites.forEach(s=>{
   const btn=node('button','dock-platform'+(state.selected?.id===s.id?' active':''));btn.type='button';btn.title=s.name;btn.setAttribute('aria-label','Abrir '+s.name);if(state.selected?.id===s.id)btn.setAttribute('aria-current','page');
   const im=node('img');im.alt='';im.loading='lazy';im.src=favicon(s);im.onerror=()=>{im.remove();btn.append(node('span','dock-placeholder','◆'))};btn.append(im);
   btn.addEventListener('click',()=>{if(state.selected?.id!==s.id)openSite(s)});items.append(btn)
 });
}
function openSite(s){state.selected=s;$('frameHint').classList.add('hidden');$('viewer').classList.remove('hidden');$('frame').src=s.url;document.body.style.overflow='hidden';setDockCollapsed(false);renderDock()}
function closeSite(){state.selected=null;$('frame').src='about:blank';$('viewer').classList.add('hidden');document.body.style.overflow=''}
$('backHome').onclick=closeSite;
function openExternal(){if(state.selected)window.open(state.selected.url,'_blank','noopener,noreferrer')}
$('openNew').onclick=openExternal;$('openOutside').onclick=openExternal;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('modal').classList.contains('hidden'))modal(false);else if(state.selected)closeSite()}});
if(!configured){$('configWarn').classList.remove('hidden');draw()}else{await Promise.all([load(),refreshAuth()]);db.auth.onAuthStateChange(()=>{setTimeout(refreshAuth,0)});db.channel('platform_changes').on('postgres_changes',{event:'*',schema:'public',table:'platforms'},()=>load()).subscribe()}
