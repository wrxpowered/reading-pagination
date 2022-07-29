import { 
  isElement, 
  createHtmlString, 
  createInlineStyleString 
} from './utilities';


// 生成随机水印位置
function createRandomPosition (viewportSize, watermarkSize) {
  const endPositionX = viewportSize.w - watermarkSize.w;
  const endPositionY = viewportSize.h - watermarkSize.h;
  return {
    top: Math.floor(Math.random() * (endPositionY + 1)) + 'px',
    left: Math.floor(Math.random() * (endPositionX + 1)) + 'px'
  }
}


// 生成水印文本内容
function createWatermarkText (watermark) {
  if (watermark.text.length < 4) {
    // 少于4个字
    return createHtmlString(
      'div',
      {
        'style': createInlineStyleString({
          'font-size': `${watermark.maxFontSize}px`,
          'line-height': `${watermark.minorAxis}px`,
        })
      },
      watermark.text
    );
  } else {
    // 4个字及以上
    const lineHeight = 1.3, whitespace = 10;
    let firstLine, secondLine;
    let fontStyle = {
      'line-height': lineHeight,
    }
    let containerStyle = {
      'transform': 'translate(-50%, -50%)',
      '-webkit-transform': 'translate(-50%, -50%)',
      'width': `${watermark.radius * 2}px`,
    }

    // 奇偶字数分行处理
    if (watermark.text.length % 2 === 0) {
      // 偶字数
      firstLine = watermark.text.slice(0, watermark.text.length / 2);
      secondLine = watermark.text.slice(watermark.text.length / 2);
    } else {
      // 奇字数
      firstLine = watermark.text.slice(0, parseInt(watermark.text.length / 2) + 1);
      secondLine = watermark.text.slice(parseInt(watermark.text.length / 2) + 1);
    }

    // 内容大小处理
    var fontSize = watermark.squareSide / firstLine.length;
    if (fontSize > watermark.maxFontSize) { fontSize = watermark.maxFontSize; }
    if (fontSize < watermark.fitFontSize) {
      var fontRatio = 0;
      if (fontSize < watermark.minFontSize) {
        // 处理字体缩放
        fontRatio = (watermark.minFontSize - fontSize) / watermark.minFontSize;
        fontSize = watermark.minFontSize;
        fontStyle['transform'] = `scale(${1 - fontRatio})`;
        fontStyle['-webkit-transform'] = `scale(${1 - fontRatio})`;
      }

      // 处理内容缩放
      const x = watermark.radius * 2, y = fontSize * lineHeight * 2;
      let actualWidth = fontSize * firstLine.length;
      actualWidth += whitespace; // 左右边缘留白空间
      const fitWidth = Math.sqrt((x * x) - (y * y));
      const ratio = 1 + ((fitWidth - actualWidth) / fitWidth);
      containerStyle['transform'] += ` scale(${ratio + fontRatio})`;
      containerStyle['width'] = `${Math.ceil(fontSize) * firstLine.length}px`;
    }
    fontStyle['font-size'] = `${fontSize}px`;

    return createHtmlString(
      'div',
      { 
        'class': 'layout-watermark-text',
        'style': createInlineStyleString(containerStyle) 
      },
      createHtmlString(
        'div',
        { 'style': createInlineStyleString(fontStyle) },
        firstLine
      ) + createHtmlString(
        'div',
        { 'style': createInlineStyleString(fontStyle) },
        secondLine
      )
    );
  }
}


// 生成水印外圈
function createWatermark (watermark, viewportSize, style) {
  var watermarkSize = {
    w: watermark.radius * 2,
    h: watermark.minorAxis
  }
  return createHtmlString(
    'div',
    {
      'class': 'layout-watermark',
      'style': createInlineStyleString({
        'width': `${watermarkSize.w}px`,
        'height': `${watermarkSize.h}px`,
        ...createRandomPosition(viewportSize, watermarkSize),
        ...style,
      })
    },
    createWatermarkText(watermark)
  );
}


/**
 * 渲染水印
 * @param {string} text 水印文本
 * @param {element} domAnchor 显示水印的根节点
 * @param {object} style 内联CSS（属性名不需要驼峰式）
 * @returns 返回水印的 html 字符串，异常情况返回 null
 */
function renderWatermark(text, domAnchor, style = {}) {
  if (!text.trim()) { return null; }

  // 水印尺寸基准
  var breakpoint = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  }
  var watermark = {
    text: text.trim(), // 文本
    radius: 0, // 圆半径
    minFontSize: 12, // 最小字号
    maxFontSize: 0, // 最大字号
    fitFontSize: 15, // 最合适字号
    squareSide: 0, // 圆内最大正方形边长
    minorAxis: 0, // 椭圆短轴
  }

  // 处理水印半径
  var viewportSize;
  if (isElement(domAnchor)) {
    viewportSize = {
      w: domAnchor.clientWidth,
      h: domAnchor.clientHeight,
    }
  } else {
    viewportSize = {
      w: window.document.documentElement.clientWidth,
      h: window.document.documentElement.clientHeight
    }
  }
  var size = Math.min(viewportSize.w, viewportSize.h);
  if (size < breakpoint.sm) {
    watermark.radius = 60;
  } else if (size < breakpoint.md) {
    watermark.radius = 70;
  } else if (size < breakpoint.lg) {
    watermark.radius = 80;
  } else if (size < breakpoint.xl) {
    watermark.radius = 100;
  } else {
    watermark.radius = size * 0.1;
  }

  // 处理圆内最大正方形边长
  const maxTextArea = 2 * watermark.radius * watermark.radius;
  watermark.squareSide = Math.ceil(Math.sqrt(maxTextArea));

  // 处理最大字号
  watermark.maxFontSize = watermark.squareSide / 3.5;

  // 圆压缩为椭圆（半径处理为椭圆短轴）
  watermark.minorAxis = (watermark.radius * 2) - (watermark.radius / 1.5);

  return createWatermark(watermark, viewportSize, style);
}


export { renderWatermark };