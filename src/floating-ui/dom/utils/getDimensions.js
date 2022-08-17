import {getBoundingClientRect} from './getBoundingClientRect';
import {isHTMLElement} from './is';

export function getDimensions(element) {
  if (isHTMLElement(element)) {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  }

  const rect = getBoundingClientRect(element);
  return {width: rect.width, height: rect.height};
}
