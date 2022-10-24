import * as http from "http";
import * as https from "https";
import { defer, lastValueFrom, retry, RetryConfig } from "rxjs";
import axios from "axios";

export const httpService = axios.create({
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
});

/**
 * ```
 * const result = await retryWithDelay(() => promiseFunction(params), { delay: 1000, count:10 } )
 * ```
 **/
export const retryWithDelay = <T>(
  promise: () => Promise<T>,
  retryConfig: Omit<RetryConfig, "resetOnSuccess">,
): Promise<T> => lastValueFrom(defer(() => promise()).pipe(retry(retryConfig)));
