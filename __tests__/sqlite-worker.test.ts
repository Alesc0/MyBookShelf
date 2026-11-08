/** @jest-environment node */
const {
  sendWorkerResult,
} = require("../node_modules/expo-sqlite/web/WorkerChannel");
test("web SQLite worker preserves the full 32-bit response length beyond 255 bytes", () => {
  const lockBuffer = new SharedArrayBuffer(4);
  const resultBuffer = new SharedArrayBuffer(4096);
  const result = [{ title: "Long title ".repeat(100) }];
  sendWorkerResult({
    id: 1,
    result: result as any,
    error: null,
    syncTrait: { lockBuffer, resultBuffer },
  });
  const length = new Uint32Array(resultBuffer, 0, 1)[0];
  expect(length).toBeGreaterThan(255);
  expect(
    JSON.parse(
      Buffer.from(new Uint8Array(resultBuffer, 4, length)).toString("utf8"),
    ),
  ).toEqual({ result });
  expect(new Int32Array(lockBuffer)[0]).toBe(2);
});
