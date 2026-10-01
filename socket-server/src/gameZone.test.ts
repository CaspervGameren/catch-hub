import { test } from "node:test";
import assert from "node:assert/strict";
import { insideZone, nextZoneStatus, validZone, validCoordinates } from "../../shared/gameZone";
const zone = { south: 51.91, west: 4.47, north: 51.93, east: 4.49 };
test("zone validation rejects invalid/reversed/oversized bounds", () => {
  assert.equal(validZone(zone), true);
  assert.equal(validZone({ ...zone, south: 52 }), false);
  assert.equal(validZone({ ...zone, west: NaN }), false);
  assert.equal(validZone({ ...zone, north: 60 }), false);
  assert.equal(validCoordinates({ latitude: Infinity, longitude: 4.48 }), false);
});
test("boundary belongs to the zone", () => {
  assert.equal(insideZone(zone, { latitude: zone.south, longitude: zone.west }), true);
});
test("outside updates preserve deadline and expire after exactly ten seconds", () => {
  const point = { latitude: 52, longitude: 4.48 };
  const initial = nextZoneStatus(zone, point, undefined, 1000);
  assert.equal(initial.deadline, 11000);
  const subsequent = nextZoneStatus(zone, point, initial, 10999);
  assert.equal(subsequent.deadline, 11000);
  assert.equal(subsequent.exceeded, false);
  assert.equal(nextZoneStatus(zone, point, subsequent, 11000).exceeded, true);
});
test("return cancels deadline; next departure starts a new grace period", () => {
  const initial = nextZoneStatus(zone, { latitude: 52, longitude: 4.48 }, undefined, 1000);
  const returned = nextZoneStatus(zone, { latitude: 51.92, longitude: 4.48 }, initial, 5000);
  assert.equal(returned.deadline, null);
  assert.equal(returned.outside, false);
  assert.equal(nextZoneStatus(zone, { latitude: 52, longitude: 4.48 }, returned, 6000).deadline, 16000);
});

test("return at or after deadline cannot undo elimination", () => {
  const initial = nextZoneStatus(zone, { latitude: 52, longitude: 4.48 }, undefined, 1000);
  assert.equal(nextZoneStatus(zone, { latitude: 51.92, longitude: 4.48 }, initial, 11000).exceeded, true);
});
