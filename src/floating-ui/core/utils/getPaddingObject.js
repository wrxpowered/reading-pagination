import {expandPaddingObject} from './expandPaddingObject';

export function getSideObjectFromPadding(padding) {
  return typeof padding !== 'number'
    ? expandPaddingObject(padding)
    : {top: padding, right: padding, bottom: padding, left: padding};
}
