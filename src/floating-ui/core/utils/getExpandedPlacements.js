import {getOppositePlacement} from './getOppositePlacement';
import {getOppositeAlignmentPlacement} from './getOppositeAlignmentPlacement';

export function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);

  return [
    getOppositeAlignmentPlacement(placement),
    oppositePlacement,
    getOppositeAlignmentPlacement(oppositePlacement),
  ];
}
