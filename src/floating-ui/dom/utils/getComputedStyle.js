import {getWindow} from './window';

export function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}
