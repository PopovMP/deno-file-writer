import { appendFile, writeFile } from "node:fs";

export type WriteFunction = (
  path: string,
  data: string,
  option: { encoding: "utf8" },
  callback: (err: Error | null) => void,
) => void;

interface QueueJob {
  timeoutId: number;
  filepath: string;
  content: string[];
  isAppend: boolean;
}

const TIMEOUT_INTERVAL: number = 100;

const queue: Record<string, QueueJob> = {};
const busy: Record<string, boolean> = {};

let appendTextFile: WriteFunction = appendFile;
let writeTextFile: WriteFunction = writeFile;

/**
 * Override the default write functions for testing purposes.
 */
export function setWriteFunctions(
  appender: WriteFunction,
  writer: WriteFunction,
): void {
  appendTextFile = appender;
  writeTextFile = writer;
}

/**
 * Appends text to a file asynchronously.
 *
 * In case of an ongoing write operation for the same file,
 * it schedules a new write operation.
 *
 * It is useful when multiple write operations are requested
 * for the same file in short time.
 *
 * Throws an error if the write operation fails.
 */
export function appendText(filepath: string, content: string): void {
  doAction(appendTextFile, filepath, content, true);
}

/**
 * Writes text to a file asynchronously.
 *
 * In case of an ongoing write operation for the same file,
 * it schedules a new write operation.
 *
 * It is useful when multiple write operations are requested
 * for the same file in short time.
 *
 * Throws an error if the write operation fails.
 */
export function writeText(filepath: string, content: string): void {
  doAction(writeTextFile, filepath, content, false);
}

/**
 * It prevents race conditions on multiple write operations
 * for the same filename.
 *
 * It schedules a new write operation,
 * if it is requested before the previous one has finished.
 */
function doAction(
  action: WriteFunction,
  filepath: string,
  content: string,
  isAppend: boolean,
): void {
  // Check is there an ongoing write operation
  if (busy[filepath]) {
    const prevQueueJob: QueueJob | undefined = queue[filepath];

    // Clear previously scheduled timeout job
    if (prevQueueJob && prevQueueJob.timeoutId) {
      clearTimeout(prevQueueJob.timeoutId);
    }

    // Schedule a new write operation
    const timeoutId = setTimeout(repeatAction, TIMEOUT_INTERVAL, filepath);

    if (prevQueueJob) {
      prevQueueJob.timeoutId = timeoutId;
      if (isAppend) {
        prevQueueJob.content.push(content);
      } else {
        prevQueueJob.content[0] = content;
      }
    } else {
      queue[filepath] = {
        timeoutId,
        filepath,
        isAppend,
        content: [content],
      };
    }

    return;
  }

  busy[filepath] = true;

  // Start write operation
  action(filepath, content, { encoding: "utf8" }, (err: Error | null): void => {
    delete busy[filepath];
    if (err) {
      throw err;
    }
  });

  function repeatAction(filePath: string): void {
    const job: QueueJob = queue[filePath];
    delete queue[filePath];

    const content: string = job.content.length > 1
      ? job.content.join("")
      : job.content[0];

    doAction(action, job.filepath, content, job.isAppend);
  }
}
