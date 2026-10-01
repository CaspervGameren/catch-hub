import { io } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
 cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, PORT: '3012' }, stdio: ['ignore', 'pipe', 'pipe'],
});
const ready = new Promise((resolve, reject) => {
 const timeout = setTimeout(() => reject(Error('Server startup timed out')), 10000);
 server.stdout.on('data', (chunk) => { if (chunk.toString().includes('Socket.IO server running')) { clearTimeout(timeout); resolve(); } });
 server.once('exit', (code) => { clearTimeout(timeout); reject(Error('Server exited: '+code)); });
});
const sockets=[];
async function connect(){ const s=io('http://127.0.0.1:3012',{transports:['websocket'],reconnection:false});sockets.push(s);await new Promise((r,j)=>{s.once('connect',r);s.once('connect_error',j)});return s; }
function emit(s,event,...args){return new Promise((r,j)=>s.timeout(2000).emit(event,...args,(e,data)=>e?j(e):r(data)));}
function event(s,name){return new Promise((r,j)=>{const t=setTimeout(()=>j(Error('No '+name)),12000);s.once(name,x=>{clearTimeout(t);r(x)});});}
try {
 await ready;
 const code='TEST-'+Date.now();
 const host=await connect(),runner=await connect(),other=await connect();
 assert.equal((await emit(host,'joinSession',{code,username:'host',role:'hunter'})).success,true);
 assert.equal((await emit(runner,'joinSession',{code,username:'runner',role:'runner'})).success,true);
 assert.equal((await emit(other,'joinSession',{code:code+'B',username:'other',role:'hunter'})).success,true);
 assert.equal((await emit(host,'startGame')).success,false);
 const zone={south:51.91,west:4.47,north:51.93,east:4.49};
 assert.equal((await emit(runner,'setGameZone',zone)).success,false);
 assert.equal((await emit(host,'setGameZone',zone)).success,true);
 assert.equal((await emit(host,'startGame')).success,true);
 assert.equal((await emit(host,'setGameZone',zone)).success,false);
 let pending=event(runner,'zoneStatus');runner.emit('updateLocation',{latitude:51.94,longitude:4.48});let status=await pending;
 assert.equal(status.outside,true);assert.equal(status.deadline-status.serverNow,10000);
 pending=event(runner,'zoneStatus');runner.emit('updateLocation',{latitude:51.92,longitude:4.48});status=await pending;assert.equal(status.outside,false);
 pending=event(runner,'zoneStatus');runner.emit('updateLocation',{latitude:51.94,longitude:4.48});status=await pending;
 const disconnected=await connect();
 assert.equal((await emit(disconnected,'joinSession',{code,username:'offline',role:'runner'})).success,true);
 let detachedStatus=event(disconnected,'zoneStatus');disconnected.emit('updateLocation',{latitude:51.94,longitude:4.48});await detachedStatus;disconnected.disconnect();
 pending=event(runner,'zoneStatus');const expired=await pending;assert.equal(expired.exceeded,true);
 runner.disconnect();await new Promise(r=>setTimeout(r,100));
 const retry=await connect();assert.equal((await emit(retry,'joinSession',{code,username:'runner',role:'runner'})).success,false);
 await new Promise(r=>setTimeout(r,400));
 const offlineRetry=await connect();assert.equal((await emit(offlineRetry,'joinSession',{code,username:'offline',role:'runner'})).success,false);
 assert.equal((await emit(other,'startGame')).success,false);
 console.log('PASS: host permissions, separate sessions, locked zone after start, ten-second warning, return/reset, timed elimination without GPS updates, rejected eliminated rejoin.');
} finally {for(const s of sockets)s.disconnect();server.kill();}
