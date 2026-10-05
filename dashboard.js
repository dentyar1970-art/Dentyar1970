import{icon}from'./icons.js';import{count,all}from'../core/db.js';import{fa,money,jalaliYear}from'../core/numbers.js';
export async function renderDashboard(el){
  const [pat,tr,ap,doc]=await Promise.all(['patients','treatments','appointments','users'].map(count));
  const [trs,pts,inv]=await Promise.all([all('treatments'),all('patients'),all('invoices')]),y=jalaliYear();
  const n=s=>trs.filter(t=>t.status===s).length;
  const C=[['t','کل بیماران',pat,'users'],['t',`بیماران جدید سال ${fa(y)}`,pts.filter(p=>p.year===y).length,'users'],
  ['g','مراجعات امروز',0,'clip'],['a','نوبت‌های امروز',ap,'cal'],['g','درمان‌های تکمیل‌شده',n('done'),'ok'],['p','درمان‌های در حال انجام',n('active'),'clip'],
  ['n','ارجاع‌شده',n('referred'),'users'],['r','لغوشده',n('canceled'),'no'],['t','تعداد کل درمان‌ها',tr,'clip'],['n','دندان‌پزشکان',doc,'users']];
  const gross=inv.reduce((s,i)=>s+(i.gross||0),0),disc=inv.reduce((s,i)=>s+(i.discount||0),0);
  el.innerHTML=`<h3>شاخص‌های کلیدی</h3><div class="grid">${C.map(([c,t,v,i])=>`<div class="k ${c}"><span class="ic">${icon(i,18)}</span><span>${t}</span><b>${fa(v)}</b></div>`).join('')}</div>
  <h3>خلاصه مالی</h3><div class="fin"><div>مبلغ ناخالص خدمات<b>${money(gross)} تومان</b></div><div>تخفیف<b>${money(disc)} تومان</b></div></div>`;
}
