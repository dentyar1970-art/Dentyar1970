// خطای JS هرگز صفحه سفید نمی‌سازد
export function initErrors(){
  const show=m=>{const f=document.getElementById('fatal');f.hidden=false;
    f.innerHTML='<h3>خطا در برنامه</h3><p></p><button class="btn" id="rl">بارگذاری دوباره</button>';
    f.querySelector('p').textContent=m;f.querySelector('#rl').onclick=()=>location.reload()};
  addEventListener('error',e=>show(e.message||'خطای ناشناخته'));
  addEventListener('unhandledrejection',e=>show(String(e.reason&&e.reason.message||e.reason)));
}
