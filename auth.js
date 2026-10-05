import{getSetting,setSetting}from'./db.js';
const hash=async p=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('dentyar:'+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')};
export async function verifyPin(pin){
  let h=await getSetting('pinHash');
  if(!h){h=await hash('12345678');await setSetting('pinHash',h)}
  return h===await hash(pin);
}
