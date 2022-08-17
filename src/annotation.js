import {
  computePosition, 
  offset, 
  shift, 
  flip, 
  arrow
} from './floating-ui/dom';
import { 
  isElement, 
  createHtmlString, 
  encodeHtmlString 
} from './utilities';


let _popper = null;
let _popperEle = null;


function showAnnotation (ele) {
  if (!isElement(ele) || !ele.classList.contains('annotation')) {
    console.error('no annotation element found.');
    return false;
  }

  const text = ele.getAttribute('data-annotation');
  if (!text) {
    console.error('invalid annotation content.');
    return false;
  }
  const annotationText = decodeURIComponent(text);

  closeAnnotation();

  _popperEle = document.createElement('div');
  _popperEle.setAttribute('class', 'annotation-popper');
  _popperEle.innerHTML = encodeHtmlString(annotationText) + createHtmlString(
    'div',
    { 
      'class': 'annotation-arrow',
      'data-popper-arrow': 'true',
    }
  );
  document.body.insertAdjacentElement('beforeend', _popperEle);

  const arrowElement = _popperEle.querySelector('.annotation-arrow')
  computePosition(ele, _popperEle, {
    placement: 'bottom',
    middleware: [
      offset(6),
      flip(),
      shift({padding: 5}),
      arrow({element: arrowElement})
    ],
  }).then(({x, y, placement, middlewareData}) => {
    Object.assign(_popperEle.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    // handle arrow
    const {x: arrowX, y: arrowY} = middlewareData.arrow;
    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[placement.split('-')[0]];
    Object.assign(arrowElement.style, {
      left: arrowX != null ? `${arrowX}px` : '',
      top: arrowY != null ? `${arrowY}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px',
    });
  });
}


function closeAnnotation () {
  if (_popper) {
    _popper.destroy();
    _popper = null;
  }
  if (_popperEle) {
    _popperEle.remove();
    _popperEle = null;
  }
}


export { showAnnotation, closeAnnotation }