// سیاست واحد اعداد: همه‌جا ارقام فارسی
const D='۰۱۲۳۴۵۶۷۸۹';
export const fa=v=>String(v).replace(/\d/g,d=>D[d]);
export const money=v=>fa(Number(v||0).toLocaleString('en-US'));
export const jalaliYear=()=>parseInt(new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric'}).format(new Date()),10);
