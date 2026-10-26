/** Attach Ctrl+C/termination only while a native CLI model call is active.
 * The signal requests cancellation through the adapter and never certifies
 * Windows descendant teardown or provider-side billing settlement.
 */
export async function withNativeCancelSignals(work, emitter = process) {
  if (typeof work !== 'function') throw new Error('Cancellation requires an operation');
  const controller = new AbortController();
  const onInterrupt = () => controller.abort();
  emitter.on('SIGINT', onInterrupt);
  emitter.on('SIGTERM', onInterrupt);
  try { return await work(controller.signal); }
  finally {
    emitter.removeListener('SIGINT', onInterrupt);
    emitter.removeListener('SIGTERM', onInterrupt);
  }
}
