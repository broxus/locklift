import axios from "axios";

export class SeService {
  constructor(private readonly rpcUrl: string) {}

  public getCurrentOffsetTime = (): Promise<number> => {
    return axios.post<string>(`${this.rpcUrl}/se/time-delta`).then(res => Number(res.data));
  };

  public setTimeOffset = (offsetInSeconds: number): Promise<number> => {
    return axios
      .post<void>(`${this.rpcUrl}/se/increase-time?delta=${offsetInSeconds.toString()}`)
      .then(() => this.getCurrentOffsetTime());
  };
}
