import { 
  VIEWPORT_DOM, 
  HEADLINE_LEVELS, 
  FORMAT, 
  HEADLINE_LEVEL_MAP,
  HEADLINE_FONT_SIZE_MAP,
  PARAGRAPH_FONT_SIZE_MAP,
  WORD_SPLIT_REG_EXP,
  ANNOTATION_REG_EXP,
  ICON_REG_EXP,
  SUPERSCRIPT_REG_EXP,
  GRAPH_HTML_REG_EXP,
} from './configs';
import { parseUrl } from './queryString';


function isArrayType(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
}
function isNumberType(arg) {
  return Object.prototype.toString.call(arg) === '[object Number]';
}
function isStringType(arg) {
  return Object.prototype.toString.call(arg) === '[object String]';
}

function isElement(o) {
  return (
    typeof HTMLElement === "object" ? (
      o instanceof HTMLElement
    ) : (
      typeof o === "object"
      && o !== null
      && o.nodeType === 1
      && typeof o.nodeName === "string"
    )
  );
}


function isTextualItem(type) {
  return type === FORMAT.PARAGRAPH || type === FORMAT.HEADLINE;
}


function checkParagraphData(item) {
  return (
    item
    && item.type === FORMAT.PARAGRAPH
    && item.data
    && isStringType(item.data.text)
  );
}


function checkHeadlineData(item) {
  return (
    item
    && item.type === FORMAT.HEADLINE
    && item.data
    && HEADLINE_LEVELS.indexOf(item.data.level) > -1
    && isStringType(item.data.text)
  );
}


function checkIllusData(item) {
  return (
    item
    && item.type === FORMAT.ILLUS
    && item.data
    && item.data.img
    && item.data.img.origWidth
    && item.data.img.origHeight
  );
}


function checkPagebreakData(item) {
  return item && item.type === FORMAT.PAGEBREAK;
}


function removeExtraTextSpace(text) {
  return text.replace(/\s+/g, ' ');
}


function getPureText(text) {
  return text.replace(ICON_REG_EXP, '').replace(ANNOTATION_REG_EXP, '').replace(SUPERSCRIPT_REG_EXP, '');
}


/**
 * 
 * @param {string} size 排版尺寸
 * @param {string} type 段落类型
 * @param {string} level （可选）标题级别
 */
function getFontSize(layoutSize, itemType, headlineLevel) {
  switch (itemType) {
    case FORMAT.PARAGRAPH:
      return PARAGRAPH_FONT_SIZE_MAP[layoutSize];
    case FORMAT.HEADLINE:
      return (
        HEADLINE_FONT_SIZE_MAP[layoutSize]
        + HEADLINE_LEVEL_MAP[headlineLevel]
      );
    default:
      break;
  }
}


// 计算图标宽高
function calculateIconSize(origWidth, origHeight, fontSize) {
  const width = parseInt(origWidth, 10);
  const height = parseInt(origHeight, 10);
  const maxHeight = parseInt(fontSize, 10);
  if (isNaN(width) || isNaN(height) || isNaN(maxHeight)) { return null; }

  let fitRatio = maxHeight / height;
  if (fitRatio > 1) { fitRatio = 1; }
  return {
    zoomedWidth: width * fitRatio,
    zoomedHeight: height * fitRatio,
  }
}


function handleCellSplit(text, layoutSize, itemType, headlineLevel) {
  var pureText = text;
  const fontSize = getFontSize(layoutSize, itemType, headlineLevel);

  function handleIcon(regExp, htmlHandler) {
    var map = {};
    pureText = pureText.replace(regExp, (...args) => {
      const offset = args[4];
      let position;
      if (offset === 0) {
        position = -1;
      } else {
        var group = getPureText(pureText.slice(0, offset)).match(WORD_SPLIT_REG_EXP);
        if (group) {
          position = group.length - 1;
        } else {
          position = -1;
        }
      }
      const content = args[2];
      const html = htmlHandler(content);
      if (map[position]) {
        map[position].push(html);
      } else {
        map[position] = [html];
      }
      return '';
    });
    return map;
  }

  // 处理图标
  var iconMap = handleIcon(ICON_REG_EXP, (link) => {
    const { query } = parseUrl(link);
    const size = calculateIconSize(query.width, query.height, fontSize);
    if (!size) { return ''; }
    return createHtmlString(
      'span',
      {
        'class': 'layout-icon',
        'style': createInlineStyleString({
          'padding-left': `${size.zoomedWidth}px`,
          'padding-right': `${fontSize / 3}px`,
          'background-image': "url(" + link.replace(/(\r\n|\n|\r)/gm, "") + ")",
          'background-repeat': 'no-repeat',
          'background-size': `${size.zoomedWidth}px ${size.zoomedHeight}px`,
          'background-position': 'center',
        })
      }
    );
  });

  // 处理注释
  var annotationMap = handleIcon(ANNOTATION_REG_EXP, (content) => {
    // @todo 整合注释
    // return createHtmlString(
    //   'img',
    //   {
    //     'class': 'mark',
    //     'src': ANNOTATION_ICON,
    //     'data-id': content,
    //     'data-annotation': content,
    //   }
    // );
    return createHtmlString(
      'span',
      {
        'class': 'mark',
        'data-id': content,
      }
    );
  });

  // 处理上标
  var supMap = handleIcon(SUPERSCRIPT_REG_EXP, (content) => {
    if (!content) { return ''; }
    return `<sup class="sup">${content}</sup>`;
  });

  // 拼接 HTML
  const result = pureText.match(WORD_SPLIT_REG_EXP);
  let offsets = [];
  let textHtml = '', elementHtml = '';
  if (iconMap['-1']) {
    textHtml += iconMap['-1'].join('');
    elementHtml += iconMap['-1'].join('');
  }
  if (result) {
    result.reduce((offset, word, index) => {
      offsets.push(offset);
      textHtml += word;
      elementHtml += `<span class="word" data-length="${word.length}" data-offset="${offset}">${word}</span>`;
      if (iconMap[index]) {
        textHtml += iconMap[index].join('');
        elementHtml += iconMap[index].join('');
      }
      if (annotationMap[index]) {
        textHtml += annotationMap[index].join('');
        elementHtml += annotationMap[index].join('');
      }
      if (supMap[index]) {
        textHtml += supMap[index].join('');
        elementHtml += supMap[index].join('');
      }
      return offset + word.length;
    }, 0);

    return {
      length: result.length,
      group: result,
      offsets: offsets,
      html: textHtml,
      elementHtml: elementHtml,
    };
  }
  return {
    length: 0,
    group: [],
    offsets: [],
    html: textHtml,
    elementHtml: elementHtml,
  };
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
    if (attr[key] !== undefined || attr[key] !== null || attr[key] !== '') {
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
    item.division.html
  );
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
          'width': `${item.baseline.zoomedWidth}px`,
          'height': `${item.baseline.zoomedHeight}px`
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


function getAbstract(data, startParaId, startOffset, endParaId, endOffset) {
  startParaId = +startParaId;
  endParaId = +endParaId;
  const items = data.filter(i =>
    isTextualItem(i.type)
    && +i.id >= startParaId
    && +i.id <= endParaId
  );
  const text = items.map(i => {
    if (+i.id === startParaId) {
      return i.data.text.slice(startOffset);
    } else if (+i.id === endParaId) {
      return i.data.text.slice(0, endOffset + 1);
    } else {
      return i.data.text;
    }
  }).join('\n');
  return text;
}


function highlightKeywordFromPara(paraInnerHtml, keyword) {
  if (!isStringType(keyword) || !paraInnerHtml) { return null; }
  keyword = keyword.trim();
  if (!keyword) { return null; }

  const fragments = paraInnerHtml.split(GRAPH_HTML_REG_EXP);
  const wrapHighlight = text => `<span style="color: red;">${text}</span>`

  // pure text
  if (fragments.length === 1) {
    return paraInnerHtml.replace(new RegExp(keyword, 'g'), wrapHighlight(keyword));
  }

  // mixed content: both text and inline graph html
  var arr = [], map = {};
  fragments.reduce((prev, curr, index) => {
    if (GRAPH_HTML_REG_EXP.test(curr)) {
      arr.push(curr);
      return prev;
    }

    // detect between text fragment
    if (curr.indexOf(keyword) > -1) {
      arr.push(curr.replace(new RegExp(keyword, 'g'), wrapHighlight(keyword)));
    } else {
      arr.push(curr);
    }

    // detect in two text fragments' boundary
    map[index] = { from: prev.length > 0 ? prev.length : 0 };
    map[index].to = map[index].from + curr.length - 1;

    const sum = prev + curr;
    if (!prev || keyword.length === 1) { return sum; }
    let posFrom = prev.lastIndexOf(keyword) + keyword.length;
    if (posFrom === keyword.length - 1) { posFrom = 0; }
    let posTo = curr.indexOf(keyword) - 1;
    if (posTo === -2) { posTo = curr.length - 1; }
    if (prev.length > 0) { posTo += prev.length; }
    if (posFrom > posTo) { return sum; }

    const from = sum.slice(posFrom, posTo + 1).indexOf(keyword) + posFrom;
    if (from > -1 + posFrom) {
      const to = from + keyword.length - 1;
      for (let i in map) {
        if (from >= map[i].from && from <= map[i].to) {
          const rightFrom = (arr[i].length - 1) - (map[i].to - from);
          arr[i] = arr[i].slice(0, rightFrom) + wrapHighlight(arr[i].slice(rightFrom));
        } else if (from < map[i].from && to > map[i].to) {
          arr[i] = wrapHighlight(arr[i]);
        } else if (to >= map[i].from && to <= map[i].to) {
          const leftTo = to - map[i].from;
          arr[i] = wrapHighlight(arr[i].slice(0, leftTo + 1)) + arr[i].slice(leftTo + 1);
        }
      }
    }
    return sum;
  }, '');

  return arr.join('');
}


export {
  isArrayType,
  isNumberType,
  isStringType,
  isElement,
  isTextualItem,
  checkParagraphData,
  checkHeadlineData,
  checkIllusData,
  checkPagebreakData,
  removeExtraTextSpace,
  getPureText,
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
  getAbstract,
  highlightKeywordFromPara,
}