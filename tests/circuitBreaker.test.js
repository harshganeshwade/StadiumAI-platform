'use strict';

const { CircuitBreaker, STATES } = require('../backend/src/services/circuitBreaker');

describe('CircuitBreaker Service', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      cooldownMs: 100,
      successThreshold: 2,
      name: 'test-breaker'
    });
  });

  test('should initialize with CLOSED state and correct options', () => {
    const status = breaker.getStatus();
    expect(status.state).toBe(STATES.CLOSED);
    expect(status.failureCount).toBe(0);
    expect(status.successCount).toBe(0);
    expect(status.name).toBe('test-breaker');
  });

  test('should execute successfully when CLOSED', async () => {
    const fn = jest.fn().mockResolvedValue('success-data');
    const res = await breaker.execute(fn);
    expect(res).toBe('success-data');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(breaker.state).toBe(STATES.CLOSED);
    expect(breaker.failureCount).toBe(0);
  });

  test('should reset failureCount in CLOSED state on success', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const successFn = jest.fn().mockResolvedValue('ok');

    // Introduce failures, but not enough to trip
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.failureCount).toBe(2);

    // Call successful function
    await breaker.execute(successFn);
    expect(breaker.failureCount).toBe(0);
    expect(breaker.state).toBe(STATES.CLOSED);
  });

  test('should trip to OPEN when failures exceed threshold', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.state).toBe(STATES.CLOSED);

    // Third failure trips it
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.state).toBe(STATES.OPEN);
    expect(breaker.nextAttemptTime).toBeGreaterThan(Date.now());
  });

  test('should return fallback value or throw when OPEN', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const fallbackVal = 'fallback-val';
    const fallbackFn = jest.fn().mockReturnValue('fallback-fn-val');

    // Trip it
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.state).toBe(STATES.OPEN);

    // Execution rejected directly
    await expect(breaker.execute(failFn)).rejects.toThrow('request rejected');

    // Executed with fallback value
    const valRes = await breaker.execute(failFn, fallbackVal);
    expect(valRes).toBe('fallback-val');

    // Executed with fallback function
    const fnRes = await breaker.execute(failFn, fallbackFn);
    expect(fnRes).toBe('fallback-fn-val');
    expect(fallbackFn).toHaveBeenCalled();
  });

  test('should transition to HALF_OPEN when cooldown expires', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const successFn = jest.fn().mockResolvedValue('ok');

    // Trip it
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.state).toBe(STATES.OPEN);

    // Wait for cooldown to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Next call should run the function and set state to HALF_OPEN
    const res = await breaker.execute(successFn);
    expect(res).toBe('ok');
    expect(breaker.state).toBe(STATES.HALF_OPEN);
  });

  test('should transition back to OPEN if execution fails in HALF_OPEN', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const successFn = jest.fn().mockResolvedValue('ok');

    // Trip it
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');

    // Cooldown
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Put into HALF_OPEN with successful call
    await breaker.execute(successFn);
    expect(breaker.state).toBe(STATES.HALF_OPEN);

    // Failed call in HALF_OPEN trips it back to OPEN immediately
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    expect(breaker.state).toBe(STATES.OPEN);
  });

  test('should transition to CLOSED if successThreshold met in HALF_OPEN', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const successFn = jest.fn().mockResolvedValue('ok');

    // Trip it
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failFn)).rejects.toThrow('fail');

    // Cooldown
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Success 1
    await breaker.execute(successFn);
    expect(breaker.state).toBe(STATES.HALF_OPEN);

    // Success 2 (successThreshold is 2)
    await breaker.execute(successFn);
    expect(breaker.state).toBe(STATES.CLOSED);
    expect(breaker.failureCount).toBe(0);
  });

  test('should fallback when function throws inside Closed/Half-Open state if fallback is defined', async () => {
    const failFn = jest.fn().mockRejectedValue(new Error('fail'));
    const fallback = 'safe-fallback';
    const res = await breaker.execute(failFn, fallback);
    expect(res).toBe('safe-fallback');
  });

  test('should reset manually', () => {
    breaker.state = STATES.OPEN;
    breaker.failureCount = 3;
    breaker.reset();
    expect(breaker.state).toBe(STATES.CLOSED);
    expect(breaker.failureCount).toBe(0);
  });
});
