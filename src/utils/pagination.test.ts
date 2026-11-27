import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPageInfo } from "./pagination";

describe("getPageInfo", () => {
  it("caps limit at 50", () => {
    assert.equal(getPageInfo(1, 500, 100).take, 50);
  });

  it("counts total pages", () => {
    assert.equal(getPageInfo(1, 10, 25).totalPages, 2);
  });
});
