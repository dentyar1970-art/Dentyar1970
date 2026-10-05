import{initErrors}from'./core/errors.js';import{open}from'./core/db.js';
import{renderLogin}from'./ui/login.js';import{renderShell}from'./ui/shell.js';import{maybeSetup}from'./ui/setup.js';
initErrors();
const root=document.getElementById('app');
const login=()=>renderLogin(root,async()=>{await maybeSetup();renderShell(root,login)});
open().then(login);
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js?v=1.0.0').catch(()=>{});
