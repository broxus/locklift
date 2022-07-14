import { getPathToVersion, isComponentVersionExists } from "./dirUtils";
import path from "path";
import { downloadLinks, executableFileName, fileNames, getGzFileName, getSupportedVersions } from "./utils";
import download from "download";
import { ungzip } from "node-gzip";
import fs from "fs-extra";
import { ComponentType } from "./constances";

export const getComponent = async ({
  version,
  component,
}: {
  component: ComponentType;
  version: string;
}): Promise<string> => {
  const tempFilePath = getPathToVersion({ component, version });

  const binaryFilePath = path.join(tempFilePath, executableFileName[component]({ version }));
  if (isComponentVersionExists({ version, component })) {
    return binaryFilePath;
  }
  console.log(`Start download ${component} version ${version}`);
  const downloadLink = downloadLinks[component]({ version });
  await download(downloadLink, tempFilePath).catch(async (e: any) => {
    const supportedVersions = await getSupportedVersions({ component });
    throw new Error(
      `Can't download ${component} version ${version}, supported versions: ${supportedVersions.map((el) => ` ${el}`)}`,
    );
  });

  const gzFilePath = path.join(tempFilePath, getGzFileName(fileNames[component]({ version })));
  const unzippedBuffer = await ungzip(fs.readFileSync(gzFilePath));
  fs.rmSync(gzFilePath);
  fs.writeFileSync(binaryFilePath, unzippedBuffer);
  fs.chmodSync(binaryFilePath, "755");
  console.log(`${component} version ${version} successfully downloaded`);
  return binaryFilePath;
};
