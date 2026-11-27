import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPageInfo } from "./pagination";

describe("getPageInfo", () => {
  it("caps limit at 50", () => {
    assert.equal(getPageInfo(1, 500, 100).take, 50);
  });

  it("counts total pages", () => {
    assert.equal(getPageInfo(1, 10, 25).totalPages, 3);
  });

  it("skips (page - 1) * take rows", () => {
    assert.equal(getPageInfo(1, 10, 25).skip, 0);
    assert.equal(getPageInfo(3, 10, 25).skip, 20);
  });

  it("handles bad input", () => {
    const info = getPageInfo(0, NaN, 25);
    assert.equal(info.skip, 0);
    assert.equal(info.take, 10);
  });

  it("keeps skip inside a 32-bit Int and total sane", () => {
    assert.ok(getPageInfo(99999999999, 50, 5).skip < 2 ** 31);
    assert.equal(getPageInfo(1, 10, NaN).totalPages, 0);
    assert.equal(getPageInfo(1, 10, -5).totalPages, 0);
  });
});
