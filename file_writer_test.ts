import { assertEquals } from "jsr:@std/assert";
import { appendText, setWriterFunction, writeText } from "./file_writer.ts";

const logBuffer: string[] = [];
let logCount = 0;

setWriterFunction(logText);

Deno.test("writeAndForget() writes correctly", async (): Promise<void> => {
  const filepath = "test.txt";
  logBuffer.length = 0;
  logCount = 0;

  writeText(filepath, "1\n");
  writeText(filepath, "2\n");
  writeText(filepath, "3\n");
  writeText(filepath, "4\n");
  writeText(filepath, "5\n");

  await delay(250);
  assertEquals(logBuffer[0], "5\n");
  assertEquals(logCount, 2);
});

Deno.test("appendAndForget() appends correctly", async (): Promise<void> => {
  const filepath = "test.txt";
  logBuffer.length = 0;
  logCount = 0;

  appendText(filepath, "1\n");
  appendText(filepath, "2\n");
  appendText(filepath, "3\n");
  appendText(filepath, "4\n");
  appendText(filepath, "5\n");

  await delay(250);
  assertEquals(logBuffer[0], "1\n");
  assertEquals(logBuffer[1], "2\n3\n4\n5\n");
  assertEquals(logCount, 2);
});

async function logText(
  filepath: string,
  content: string,
  options: { append?: boolean },
): Promise<void> {
  void filepath;

  if (options.append) {
    logBuffer.push(content);
  } else {
    logBuffer[0] = content;
  }

  logCount++;

  return await delay(100);
}

function delay(delayInMillis: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(resolve, delayInMillis);
  });
}
