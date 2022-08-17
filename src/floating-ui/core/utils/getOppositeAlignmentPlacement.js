const hash = {start: 'end', end: 'start'};

export function getOppositeAlignmentPlacement(placement) {
  return placement.replace(
    /start|end/g,
    (matched) => (hash)[matched]
  );
}
