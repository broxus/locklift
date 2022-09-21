import path from "path";
import fs from "fs-extra";
import { ungzip } from "node-gzip";

import { getPathToVersion, isComponentVersionExists } from "./dirUtils";
import { downloadLinks, executableFileName, fileNames, getGzFileName, getSupportedVersions } from "./utils";
import { ComponentType } from "./constants";
import { logger } from "../logger";
import { httpService } from "../httpService";

export const getComponent = async ({
  version,
  component,
}: {
  component: ComponentType;
  version: string;
}): Promise<string> => {
  const tempFileBaseDir = getPathToVersion({ component, version });

  const binaryFilePath = path.join(tempFileBaseDir, executableFileName[component]({ version }));
  if (isComponentVersionExists({ version, component })) {
    return binaryFilePath;
  }

  logger.printInfo(`Start downloading ${component} version ${version}`);
  const downloadLink = downloadLinks[component]({ version });

  await fs.ensureDir(tempFileBaseDir);
  const gzFilePath = path.join(tempFileBaseDir, getGzFileName(fileNames[component]({ version })));

  await download(downloadLink, gzFilePath).catch(async () => {
    const supportedVersions = await getSupportedVersions({ component });
    console.error(`Can't download ${component} version ${version}, supported versions: ${supportedVersions.join(" ")}`);
    await fs.rmdir(tempFileBaseDir);
    process.exit(1);
  });

  try {
    const unzippedBuffer = await ungzip(fs.readFileSync(gzFilePath));
    fs.rmSync(gzFilePath);
    fs.writeFileSync(binaryFilePath, unzippedBuffer);
    fs.chmodSync(binaryFilePath, "755");
    logger.printInfo(`${component} version ${version} successfully downloaded`);

    return binaryFilePath;
  } catch (e) {
    await fs.rmdir(tempFileBaseDir);
    throw e;
  }
};

export async function download(fileUrl: string, outputLocationPath: string) {
  const writer = fs.createWriteStream(outputLocationPath);

  return httpService({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  })
    .then(response => {
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);

        let error: Error | null;
        writer.on("error", err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on("close", () => {
          if (!error) {
            resolve(true);
          }
        });
      });
    })
    .catch(async e => {
      await fs.unlink(outputLocationPath);
      throw e;
    });
}
