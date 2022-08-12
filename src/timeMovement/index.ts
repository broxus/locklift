import { ConfigState, NetworkValue } from "../config";
import { logger } from "../logger";
import { Clock } from "everscale-standalone-client/nodejs";
import { SeService } from "./seService";

export class TimeMovement {
  constructor(
    private readonly seService: SeService,
    private readonly clock: Clock,
    private readonly isEnabled: boolean,
  ) {}

  /*
   * Returns current offset in seconds
   */
  public getTimeOffset = (): number => {
    if (!this.isEnabled) {
      logger.printWarn("TimeMovement is disabled");
      return 0;
    }
    return toSeconds(this.clock.offset);
  };

  /*
   * Returns current time
   */
  public getCurrentTime = () => this.clock.time;
  /*
   * Set node and provider offset in seconds
   @param offsetInSeconds offset in seconds
   */
  public increaseTime = async (seconds: number): Promise<void> => {
    if (!this.isEnabled) {
      return logger.printWarn("TimeMovement is disabled");
    }
    if (seconds < 0) {
      return logger.printWarn("TimeMovement is not allowed to go back in time");
    }
    this.clock.offset = await this.seService.setTimeOffset(seconds).then(toMs);
  };
  //TODO make it public when it will be resolved
  private resetTimeOffset = async (): Promise<void> => {
    if (!this.isEnabled) {
      return logger.printWarn("TimeMovement is disabled");
    }
    this.clock.offset = await this.seService.resetTimeOffset().then(toMs);
    console.log(`TimeMovement reset to ${this.getTimeOffset()}`);
  };
}

export const createTimeMovement = async (
  clock: Clock,
  connectionConfig: NetworkValue<ConfigState.INTERNAL>,
): Promise<TimeMovement> => {
  const rpcUrl =
    typeof connectionConfig.connection !== "string" &&
    connectionConfig.connection.type === "graphql" &&
    connectionConfig.connection.data.endpoints[0];

  if (!rpcUrl) {
    return new TimeMovement(new SeService(""), clock, false);
  }
  const rpcOrigin = new URL(rpcUrl).origin;
  const seService = new SeService(rpcOrigin);
  const { currentOffsetInSeconds, isEnabled } = await seService
    .getCurrentOffsetTime()
    .then(currentOffsetInSeconds => ({ currentOffsetInSeconds, isEnabled: true }))
    .catch(() => ({ isEnabled: false, currentOffsetInSeconds: 0 }));
  if (currentOffsetInSeconds > 0) {
    logger.printWarn(`Current SE time delta is ${currentOffsetInSeconds} seconds. Provider will sync with this offset`);
  }
  clock.offset = toMs(currentOffsetInSeconds);
  return new TimeMovement(seService, clock, isEnabled);
};

const toMs = (seconds: number) => seconds * 1000;
const toSeconds = (ms: number) => ms / 1000;
