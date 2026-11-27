import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcFare } from "./fare";

describe("calcFare", () => {
  it("charges per started km", () => {
    assert.equal(calcFare(5), 110);
  });

  it("never goes below the minimum fare", () => {
    assert.equal(calcFare(0), 50);
  });
});
