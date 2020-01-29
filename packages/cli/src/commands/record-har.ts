import { readJson, writeFileSync } from 'fs-extra';
import { resolve, join } from 'path';
import { recordHARClient, IConditions } from '@tracerbench/core';
import { headlessFlags } from '../command-config/default-flag-args';
import { TBBaseCommand, getConfig } from '../command-config';
import {
  dest,
  url,
  cookiespath,
  filename,
  marker,
  config,
  headless
} from '../helpers/flags';

export default class RecordHAR extends TBBaseCommand {
  public static description = 'Generates a HAR file from a URL.';
  public static flags = {
    url: url({ required: true, default: undefined }),
    dest: dest({ required: true }),
    cookiespath: cookiespath({ required: true }),
    filename: filename({ required: true, default: 'tracerbench' }),
    marker: marker({ required: true }),
    config: config(),
    headless
  };
  public async init() {
    const { flags } = this.parse(RecordHAR);
    this.parsedConfig = getConfig(flags.config, flags, this.explicitFlags);
  }

  public async run() {
    const { flags } = this.parse(RecordHAR);
    const { url, dest, cookiespath, filename, marker } = flags;
    const { network, cpuThrottleRate, headless } = this.parsedConfig;
    let { browserArgs } = this.parsedConfig;
    const conditions: IConditions = {
      network: network ? network : 'none',
      cpu: cpuThrottleRate ? parseInt(cpuThrottleRate as string, 10) : 1
    };
    // grab the auth cookies
    const cookies = await readJson(resolve(cookiespath));

    // if headless flag is true include the headless flags
    if (headless) {
      browserArgs = Array.isArray(browserArgs)
        ? browserArgs.concat(headlessFlags)
        : headlessFlags;
    }

    // record the actual HAR and return the archive file
    const harArchive = await recordHARClient(
      url,
      cookies,
      marker,
      conditions,
      browserArgs
    );

    const harPath = join(dest, `${filename}.har`);

    writeFileSync(harPath, JSON.stringify(harArchive));

    this.log(`HAR recorded and available here: ${harPath}`);
  }
}
