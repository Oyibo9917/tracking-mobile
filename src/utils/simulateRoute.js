/**
 * Generates a list of interpolated coordinates walking from `start` to `end`.
 * @param {{ latitude: number, longitude: number }} start
 * @param {{ latitude: number, longitude: number }} end
 * @param {number} steps  - how many points to generate (default 20)
 * @returns {{ latitude: number, longitude: number }[]}
 */
export function buildRoute(start, end, steps = 20) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      latitude:  start.latitude  + (end.latitude  - start.latitude)  * t,
      longitude: start.longitude + (end.longitude - start.longitude) * t,
    });
  }
  return points;
}
