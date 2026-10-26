import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {withNativeCancelSignals} from '../src/native-cancel.mjs';

test('CLI signal handler sends cooperative abort without leaking process listeners',async()=>{
  const host=new EventEmitter();
  let signal;
  const running=withNativeCancelSignals(async s=>{
    signal=s;
    await new Promise(resolve=>s.addEventListener('abort',resolve,{once:true}));
    return s.aborted;
  },host);
  assert.equal(host.listenerCount('SIGINT'),1);
  assert.equal(host.listenerCount('SIGTERM'),1);
  host.emit('SIGINT');
  assert.equal(await running,true);
  assert.equal(signal.aborted,true);
  assert.equal(host.listenerCount('SIGINT'),0);
  assert.equal(host.listenerCount('SIGTERM'),0);
});
test('CLI cancel also handles termination signal and leaves thrown provider error intact',async()=>{
  const host=new EventEmitter();
  const result=withNativeCancelSignals(async s=>{
    host.emit('SIGTERM');
    assert.equal(s.aborted,true);
    throw new Error('Safe test failure');
  },host);
  await assert.rejects(result,/Safe test failure/);
  assert.equal(host.listenerCount('SIGINT'),0);
  assert.equal(host.listenerCount('SIGTERM'),0);
});
test('CLI native cancellation handler is not installed on preview or empty calls',async()=>{
  const host=new EventEmitter();
  assert.equal(await withNativeCancelSignals(async signal=>{
    assert.equal(signal.aborted,false);
    return 'ok';
  },host),'ok');
  assert.equal(host.listenerCount('SIGINT'),0);
  assert.equal(host.listenerCount('SIGTERM'),0);
  await assert.rejects(withNativeCancelSignals(null,host),/requires an operation/);
});
