import {isNode} from './is';

export function getDocumentElement(node) {
  return (
    (isNode(node) ? node.ownerDocument : node.document) || window.document
  ).documentElement;
}
