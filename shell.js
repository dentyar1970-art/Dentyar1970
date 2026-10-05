import{icon}from'./icons.js';import{getSetting}from'../core/db.js';import{renderDashboard}from'./dashboard.js';
const TABS=[['dash','داشبورد','grid'],['appt','نوبت‌دهی','cal'],['reg','ثبت بیمار','reg'],['pat','بیماران','users'],['doc','دندان‌پزشکان','tooth'],['rep','گزارش‌ها','chart'],['bak','پشتیبان‌گیری','dl'],['set','تنظیمات','gear'],['prof','پروفایل','user'],['help','راهنما','book'],['con','ارتباط با ما','phone']];
export async function renderShell(root,onLogout){
  const name=await getSetting('centerName','مطب لبخند زیبا');
  root.innerHTML=`<header class="hdr"><div class="org"><div class="logo-sm"><img src="assets/logo.png" alt=""></div><span id="cn"></span></div>
  <div class="center"><div class="logo-md"><img src="assets/logo.png" alt="DENTYAR"></div><h2>DENTYAR</h2><span class="tag">دنت‌یار؛ دستیار هوشمند دندان‌پزشکی شما</span></div>
  <div style="justify-self:start"><button class="out" id="lo"><span>${icon('lock',24)}</span><span>خروج</span></button></div></header>
  <nav>${TABS.map(([k,t,i])=>`<button data-k="${k}">${icon(i,16)}${t}</button>`).join('')}</nav><main id="v"></main>`;
  root.querySelector('#cn').textContent=name;
  root.querySelector('#lo').onclick=onLogout;
  const v=root.querySelector('#v'),btns=[...root.querySelectorAll('nav button')];
  const go=async k=>{btns.forEach(b=>b.classList.toggle('act',b.dataset.k===k));
    if(k==='dash')await renderDashboard(v);
    else v.innerHTML='<div class="box">این بخش در مرحله بعد ساخته می‌شود.</div>'};
  btns.forEach(b=>b.onclick=()=>go(b.dataset.k));go('dash');
}
