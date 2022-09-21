import { httpService } from "../httpService";

export class SeService {
  constructor(private readonly rpcUrl: string) {}

  public getCurrentOffsetTime = (): Promise<number> => {
    return httpService.post<string>(`${this.rpcUrl}/se/time-delta`).then(res => Number(res.data));
  };

  public setTimeOffset = (offsetInSeconds: number): Promise<number> => {
    return httpService
      .post<void>(`${this.rpcUrl}/se/increase-time?delta=${offsetInSeconds.toString()}`)
      .then(() => this.getCurrentOffsetTime());
  };

  public resetTimeOffset = () => {
    return httpService.post<void>(`${this.rpcUrl}/se/reset-time`).then(() => this.getCurrentOffsetTime());
  };
}
