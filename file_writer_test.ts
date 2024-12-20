import { strictEqual } from "node:assert";
import { test } from "node:test";
import { appendText, setWriteFunctions, writeText } from "./file_writer.ts";

const logBuffer: string[] = [];
let logCount = 0;

setWriteFunctions(appendTextMoq, writeTextMoq);

test("writeAndForget() writes correctly", async (): Promise<void> => {
  const filepath = "test.txt";
  logBuffer.length = 0;
  logCount = 0;

  writeText(filepath, "1\n");
  writeText(filepath, "2\n");
  writeText(filepath, "3\n");
  writeText(filepath, "4\n");
  writeText(filepath, "5\n");

  await delay(150);
  strictEqual(logBuffer[0], "5\n");
  strictEqual(logCount, 2);
});

test("appendAndForget() appends correctly", async (): Promise<void> => {
  const filepath = "test.txt";
  logBuffer.length = 0;
  logCount = 0;

  appendText(filepath, "1\n");
  appendText(filepath, "2\n");
  appendText(filepath, "3\n");
  appendText(filepath, "4\n");
  appendText(filepath, "5\n");

  await delay(150);
  strictEqual(logBuffer[0], "1\n");
  strictEqual(logBuffer[1], "2\n3\n4\n5\n");
  strictEqual(logCount, 2);
});

function appendTextMoq(
  filepath: string,
  content: string,
  options: { encoding: "utf8" },
  callback: (err: Error | null) => void,
): void {
  void filepath;
  void options;

  logBuffer.push(content);
  logCount++;

  setTimeout(callback, 10, null);
}

function writeTextMoq(
  filepath: string,
  content: string,
  options: { encoding: "utf8" },
  callback: (err: Error | null) => void,
): void {
  void filepath;
  void options;

  logBuffer[0] = content;
  logCount++;

  setTimeout(callback, 10, null);
}

function delay(delayInMillis: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(resolve, delayInMillis);
  });
}
