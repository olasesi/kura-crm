import CircuitBreaker from "opossum";
import { logger } from "./logger";

const defaultOptions: CircuitBreaker.Options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  name: "default",
  volumeThreshold: 5,
};

export const createCircuitBreaker = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: Partial<CircuitBreaker.Options> = {}
): CircuitBreaker<TArgs, TReturn> => {
  const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });

  breaker.on("open", () => {
    logger.warn(`Circuit breaker "${options.name || "unknown"}" opened`);
  });

  breaker.on("halfOpen", () => {
    logger.info(`Circuit breaker "${options.name || "unknown"}" half-open`);
  });

  breaker.on("close", () => {
    logger.info(`Circuit breaker "${options.name || "unknown"}" closed`);
  });

  breaker.fallback(() => {
    logger.warn(`Circuit breaker "${options.name || "unknown"}" fallback called`);
    return Promise.reject(new Error("Service temporarily unavailable")) as any;
  });

  return breaker;
};
