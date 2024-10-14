interface QueueJob {
  timeoutID: number;
  filepath: string;
  content: string;
  isAppend: boolean;
}

type WriteAction = (
  filepath: string,
  content: string,
  isAppend: boolean,
  callback: (err: Error | null) => void,
) => void;

const TIMEOUT_INTERVAL: number = 100;

const queue: Record<string, QueueJob> = {};
const busy: Record<string, boolean> = {};

export type WriterFunction = (
  path: string,
  data: string,
  option: { append?: boolean },
) => Promise<void>;

let writeTextFile: WriterFunction = Deno.writeTextFile;

/**
 * Sets a custom function to write text to a file.
 * By default, it uses Deno.writeTextFile.
 */
export function setWriterFunction(writer: WriterFunction): void {
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
  doAction(writeFile, filepath, content, true);
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
  doAction(writeFile, filepath, content, false);
}

/**
 * It prevents race conditions on multiple write operations
 * for the same filename.
 *
 * It schedules a new write operation,
 * if it is requested before the previous one has finished.
 */
function doAction(
  action: WriteAction,
  filepath: string,
  content: string,
  isAppend: boolean,
): void {
  // Check is there an ongoing write operation
  if (busy[filepath]) {
    const prevQueueJob: QueueJob | undefined = queue[filepath];

    // Clear previously scheduled timeout job
    if (prevQueueJob && prevQueueJob.timeoutID) {
      clearTimeout(prevQueueJob.timeoutID || 0);
    }

    // Schedule a new write operation
    const timeoutID: number = setTimeout(
      repeatWriteFile,
      TIMEOUT_INTERVAL,
      filepath,
    );

    if (prevQueueJob) {
      prevQueueJob.timeoutID = timeoutID;
      if (isAppend) {
        prevQueueJob.content += content;
      } else {
        prevQueueJob.content = content;
      }
    } else {
      queue[filepath] = { timeoutID, filepath, content, isAppend };
    }

    return;
  }

  // Mark filePath busy
  busy[filepath] = true;

  // Start write operation
  action(filepath, content, isAppend, (err: Error | null): void => {
    // Release busy
    delete busy[filepath];
    if (err) throw err;
  });

  function repeatWriteFile(filePath: string): void {
    const job: QueueJob = queue[filePath];
    delete queue[filePath];

    doAction(action, job.filepath, job.content, job.isAppend);
  }
}

/**
 * Executes the actual write operation asynchronously.
 * Calls the callback function when the write is ready.
 */
function writeFile(
  filepath: string,
  content: string,
  isAppend: boolean,
  callback: (err: Error | null) => void,
): void {
  (async (): Promise<void> => {
    try {
      await writeTextFile(filepath, content, { append: isAppend });
    } catch (err) {
      callback(err as Error);
      return;
    }
    callback(null);
  })();
}
