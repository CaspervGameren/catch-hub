export interface GameZone {
  south: number;
  west: number;
  north: number;
  east: number;
}
export interface Coordinates { latitude: number; longitude: number }
export interface ZoneStatus {
  outside: boolean;
  deadline: number | null;
  exceeded: boolean;
  serverNow: number;
}
export const RETURN_TIME_MS = 10_000;
export function validCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const p = value as Coordinates;
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
}
export function validZone(value: unknown): value is GameZone {
  if (!value || typeof value !== "object") return false;
  const z = value as GameZone;
  return [z.south, z.west, z.north, z.east].every(Number.isFinite)
    && z.south >= -85 && z.north <= 85 && z.west >= -180 && z.east <= 180
    && z.north > z.south && z.east > z.west
    && z.north - z.south <= 0.2 && z.east - z.west <= 0.2;
}
export function insideZone(zone: GameZone, point: Coordinates): boolean {
  return point.latitude >= zone.south && point.latitude <= zone.north
    && point.longitude >= zone.west && point.longitude <= zone.east;
}
export function nextZoneStatus(zone: GameZone, point: Coordinates, previous: ZoneStatus | undefined, now: number): ZoneStatus {
  if (previous?.outside && previous.deadline !== null && now >= previous.deadline) return { ...previous, exceeded: true, serverNow: now };
  if (insideZone(zone, point)) return { outside: false, deadline: null, exceeded: false, serverNow: now };
  const deadline = previous?.outside && previous.deadline !== null ? previous.deadline : now + RETURN_TIME_MS;
  return { outside: true, deadline, exceeded: now >= deadline, serverNow: now };
}
