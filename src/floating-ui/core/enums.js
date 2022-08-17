export const sides = ['top', 'right', 'bottom', 'left'];
export const allPlacements = sides.reduce(
  (acc, side) =>
    acc.concat(
      side,
      `${side}-start`,
      `${side}-end`
    ),
  []
);
