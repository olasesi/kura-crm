declare module "opossum" {
  import { EventEmitter } from "events";

  namespace CircuitBreaker {
    interface Options {
      timeout?: number;
      errorThresholdPercentage?: number;
      resetTimeout?: number;
      name?: string;
      volumeThreshold?: number;
    }
  }

  class CircuitBreaker<TArgs extends unknown[] = unknown[], TReturn = unknown> extends EventEmitter {
    constructor(fn: (...args: TArgs) => Promise<TReturn>, options?: CircuitBreaker.Options);
    fire(...args: TArgs): Promise<TReturn>;
    shutdown(): void;
    fallback(fn: (...args: TArgs) => Promise<TReturn>): void;
    readonly state: { name: string; open: boolean; closed: boolean; halfOpen: boolean };
  }

  export = CircuitBreaker;
}
