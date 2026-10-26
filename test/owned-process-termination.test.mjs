import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { requestOwnedProcessTermination } from '../src/owned-process-termination.mjs';

const owned = pid => {
  const child = new EventEmitter();
  child.pid = pid;
  child.killCount = 0;
  child.kill = () => { child.killCount++; return true; };
  return child;
};

test('Windows cancellation requests taskkill tree for a valid owned child, without a shell', () => {
  const child = owned(4242);
  const killer = new EventEmitter();
  let captured, unrefs = 0;
  killer.unref = () => { unrefs++; };
  const spawnImpl = (exe,args,options) => {
    captured = {exe,args,options};
    return killer;
  };
  requestOwnedProcessTermination(child,{platform:'win32',spawnImpl});
  assert.match(captured.exe, /[\\/]System32[\\/]taskkill[.]exe$/i);
  assert.deepEqual(captured.args,['/PID','4242','/T','/F']);
  assert.deepEqual(captured.options,{shell:false,windowsHide:true,stdio:'ignore'});
  assert.equal(child.killCount,0,'Do not kill parent before taskkill enumerates descendants');
  assert.equal(unrefs,1);
  killer.emit('close',0);
  assert.equal(child.killCount,0);
});

test('Windows failed taskkill triggers at most one best-effort direct child termination', () => {
  const child = owned(5151);
  const killer = new EventEmitter();
  requestOwnedProcessTermination(child,{platform:'win32',spawnImpl:()=>killer});
  killer.emit('error',new Error('native taskkill failed'));
  killer.emit('close',1);
  assert.equal(child.killCount,1);
  const thrownChild = owned(5152);
  requestOwnedProcessTermination(thrownChild,{
    platform:'win32',spawnImpl:()=>{throw new Error('unavailable');}
  });
  assert.equal(thrownChild.killCount,1);
});

test('never pass a missing, recycled or untrusted PID to Windows tree termination',()=>{
  for (const pid of [undefined,null,0,-1,1.25,'123',2147483648,Infinity]) {
    const child=owned(pid);
    requestOwnedProcessTermination(child,{
      platform:'win32',spawnImpl:()=>{throw new Error('taskkill should not run');}
    });
    assert.equal(child.killCount,1,String(pid));
  }
  const exited=owned(888);
  exited.exitCode=0;
  requestOwnedProcessTermination(exited,{
    platform:'win32',spawnImpl:()=>{throw new Error('taskkill should not run after exit');}
  });
  assert.equal(exited.killCount,1);
  const posix=owned(777);
  requestOwnedProcessTermination(posix,{
    platform:'linux',spawnImpl:()=>{throw new Error('Windows helper must not run on POSIX');}
  });
  assert.equal(posix.killCount,1);
});
