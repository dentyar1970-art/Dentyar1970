import{getSetting,setSetting}from'../core/db.js';
export async function maybeSetup(){
  if(await getSetting('setupState'))return;
  return new Promise(done=>{
    const m=document.createElement('div');m.className='modal';
    m.innerHTML=`<form><h3 style="margin:0;border:0;padding:0">راه‌اندازی اولیه</h3>
    <input id="n" placeholder="نام مرکز" value="مطب لبخند زیبا">
    <select id="t"><option>مطب دندان‌پزشکی</option><option>کلینیک</option><option>درمانگاه</option></select>
    <button class="btn" type="submit">ذخیره</button><button class="btn alt" type="button" id="l">بعداً انجام می‌دهم</button></form>`;
    document.body.append(m);
    const fin=()=>{m.remove();done()};
    m.querySelector('form').onsubmit=async ev=>{ev.preventDefault();
      await setSetting('centerName',m.querySelector('#n').value.trim()||'مطب لبخند زیبا');
      await setSetting('centerType',m.querySelector('#t').value);await setSetting('setupState','done');fin()};
    m.querySelector('#l').onclick=async()=>{await setSetting('setupState','later');fin()};
  });
}
