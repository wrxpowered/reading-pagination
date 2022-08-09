import { createPopper } from './popper';
import { isElement, createHtmlString, encodeHtmlString } from './utilities';


const ARROW_SIZE = 8;
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

  _popper = createPopper(ele, _popperEle, {
    placement: 'auto',
    modifiers: [
      {
        name: 'eventListeners',
        enabled: false,
      },
      {
        name: 'offset',
        options: {
          offset: [0, ARROW_SIZE],
        },
      },
    ],
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