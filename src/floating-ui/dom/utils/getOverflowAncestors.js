import {getNearestOverflowAncestor} from './getNearestOverflowAncestor';
import {getWindow} from './window';
import {isOverflowElement} from './is';

export function getOverflowAncestors(node, list = []) {
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === node.ownerDocument?.body;
  const win = getWindow(scrollableAncestor);
  const target = isBody
    ? ([win]).concat(
        win.visualViewport || [],
        isOverflowElement(scrollableAncestor) ? scrollableAncestor : []
      )
    : scrollableAncestor;
  const updatedList = list.concat(target);

  return isBody
    ? updatedList
    : // @ts-ignore: isBody tells us target will be an HTMLElement here
      updatedList.concat(getOverflowAncestors(target));
}
