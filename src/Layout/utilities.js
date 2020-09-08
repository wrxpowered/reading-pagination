import { VIEWPORT_DOM, HEADLINE_LEVELS, FORMAT, WORD_SPLIT_REG_EXP } from './configs';


function isArrayType(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
}


function isTextualItem(type) {
  return type === FORMAT.PARAGRAPH || type === FORMAT.HEADLINE;
}


function checkParagraphData(item) {
  return (
    item.type === FORMAT.PARAGRAPH
    && item.data
  );
}


function checkHeadlineData(item) {
  return (
    item.type === FORMAT.HEADLINE
    && item.data
    && HEADLINE_LEVELS.indexOf(item.data.level) > -1
  );
}


function checkIllusData(item) {
  return (
    item.type === FORMAT.ILLUS
    && item.data
    && item.data.img
    && item.data.img.origWidth
    && item.data.img.origHeight
  );
}


function checkPagebreakData(item) {
  return item.type === FORMAT.PAGEBREAK;
}


function handleTrimText(text) {
  return text.replace(/\s+/g, ' ');
}


function handleCellSplit(text) {
  const result = text.match(WORD_SPLIT_REG_EXP);
  if (result) {
    return {
      length: result.length,
      group: result,
      html: result.map(word => {
        return `<span>${word}</span>`;
      }).join('')
    };
  }
  return null;
}


function getBoundaryHeight(restHeight, boundary) {
  const boundaryIndex = boundary.sort((a, b) => a - b).indexOf(restHeight);
  if (boundaryIndex === 0) {
    return boundary[0];
  } else {
    return boundary[boundaryIndex - 1];
  }
}


function getBoxModelValue(element) {
  const s = window.getComputedStyle(element);
  const prefixGroup = ['padding', 'margin'];
  const postfixGroup = ['Top', 'Left', 'Bottom', 'Right'];
  let r = {};

  prefixGroup.forEach(prefix => {
    postfixGroup.forEach(postfix => {
      r[prefix + postfix] = parseFloat(s[prefix + postfix], 10);
    });
  });

  r.paddingV = r.paddingTop + r.paddingBottom;
  r.paddingH = r.paddingLeft + r.paddingRight;
  r.marginV = r.marginTop + r.marginBottom;
  r.marginH = r.marginLeft + r.marginRight;
  r.lineHeight = parseFloat(s.lineHeight, 10);
  r.width = parseFloat(s.width, 10);
  r.height = parseFloat(s.height, 10);
  r.boxSizing = s.boxSizing;

  return r;
}


function createElement(type, attr, innerHTML) {
  const element = document.createElement(type);
  for (let key in attr) {
    element.setAttribute(key, attr[key]);
  }
  if (innerHTML) {
    element.innerHTML = innerHTML;
  }
  return element;
}


function createInlineStyleString(attr) {
  let str = '';
  for (let key in attr) {
    if (attr[key]) {
      str += `${key}:${attr[key]};`;
    }
  }
  return str;
}


function createHtmlString(type, attr, childrenString = '') {
  let attrStr = '';
  for (let key in attr) {
    if (attr[key]) {
      attrStr += ` ${key}="${attr[key]}"`;
    }
  }
  if (type === 'img') {
    return `<${type}${attrStr} />`;
  }
  return `<${type}${attrStr}>${childrenString}</${type}>`;
}


function createTextualHtml(item) {
  return createHtmlString(
    'div',
    {
      'class': item.className,
      'data-id': item.id,
      'style': createInlineStyleString({
        'margin-top': item.offset ? `-${item.offset}px` : undefined
      })
    },
    item.data.text
  )
}


function createIllusHtml(item) {
  return createHtmlString(
    'div',
    {
      'class': item.className,
      'data-id': item.id
    },
    createHtmlString(
      'img',
      {
        'src': item.data.img.src,
        'style': createInlineStyleString({
          'width': `${item.data.img.zoomedWidth}px`,
          'height': `${item.data.img.zoomedHeight}px`
        })
      }
    )
  );
}


function checkBrowserEnvironment() {
  return typeof window !== 'undefined';
}


function checkViewportDom() {
  let viewport = window.document.querySelector(`#${VIEWPORT_DOM.ID}`);
  if (!viewport) {
    viewport = createElement(
      'div',
      {
        'id': VIEWPORT_DOM.ID,
        'class': VIEWPORT_DOM.CLASSNAME
      }
    );
    window.document.body.appendChild(viewport);
  }
  return viewport;
}


export {
  isArrayType,
  isTextualItem,
  checkParagraphData,
  checkHeadlineData,
  checkIllusData,
  checkPagebreakData,
  handleTrimText,
  handleCellSplit,
  getBoundaryHeight,
  getBoxModelValue,
  createElement,
  createInlineStyleString,
  createHtmlString,
  createTextualHtml,
  createIllusHtml,
  checkBrowserEnvironment,
  checkViewportDom,
}