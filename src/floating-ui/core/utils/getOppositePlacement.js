const hash = {left: 'right', right: 'left', bottom: 'top', top: 'bottom'};

export function getOppositePlacement(placement) {
  return placement.replace(
    /left|right|bottom|top/g,
    (matched) => (hash)[matched]
  );
}
