// IndexedDB نسخه‌بندی‌شده؛ هر نسخه یک migration بدون حذف داده
const NAME='dentyar',STORES=['settings','users','patients','patientMedical','dentalCharts','toothHistory','documents','patientTimeline','appointments','services','treatmentPlans','treatments','invoices','payments','insurance','laboratories','inventory','reports','auditLogs','backups','syncQueue'];
const MIGRATIONS={1(db){STORES.forEach(s=>db.createObjectStore(s,{keyPath:s==='settings'?'key':'id'}))}};
const LATEST=Math.max(...Object.keys(MIGRATIONS).map(Number));
let _db;
export const open=()=>_db||(_db=new Promise((ok,no)=>{
  const r=indexedDB.open(NAME,LATEST);
  r.onupgradeneeded=e=>{for(let v=e.oldVersion+1;v<=LATEST;v++)MIGRATIONS[v](r.result)};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
}));
const run=async(s,mode,fn)=>{const db=await open();return new Promise((ok,no)=>{
  const t=db.transaction(s,mode),q=fn(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})};
export const get=(s,k)=>run(s,'readonly',o=>o.get(k));
export const put=(s,v)=>run(s,'readwrite',o=>o.put(v));
export const count=s=>run(s,'readonly',o=>o.count());
export const all=s=>run(s,'readonly',o=>o.getAll());
export const getSetting=async(k,d)=>{const r=await get('settings',k);return r?r.value:d};
export const setSetting=(k,value)=>put('settings',{key:k,value});
