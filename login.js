import{verifyPin}from'../core/auth.js';import{icon}from'./icons.js';import{fa}from'../core/numbers.js';
export function renderLogin(root,onOk){
  let pin='';
  root.innerHTML=`<div class="login"><div class="logo-lg"><img src="assets/logo.png" alt="DENTYAR"></div>
  <h1>DENTYAR</h1><p class="tag">دنت‌یار؛ دستیار هوشمند دندان‌پزشکی شما</p>
  <div class="dots">${'<i></i>'.repeat(8)}</div><p class="err" id="e"></p>
  <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${fa(n)}</button>`).join('')}
  <button class="clr" id="c">C</button><button data-n="0">${fa(0)}</button><button class="ok" id="ok">${icon('unlock',22)}</button></div>
  <p class="hint">رمز پیش‌فرض: ${fa('12345678')} — از بخش تنظیمات قابل تغییر است</p></div>`;
  const dots=[...root.querySelectorAll('.dots i')],e=root.querySelector('#e');
  const paint=()=>dots.forEach((d,i)=>d.classList.toggle('on',i<pin.length));
  root.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{if(pin.length<8){pin+=b.dataset.n;e.textContent='';paint()}});
  root.querySelector('#c').onclick=()=>{pin='';paint();e.textContent=''};
  root.querySelector('#ok').onclick=async()=>{
    if(await verifyPin(pin))return onOk();
    pin='';paint();e.textContent='رمز عبور نادرست است';
    const d=root.querySelector('.dots');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake')};
}
