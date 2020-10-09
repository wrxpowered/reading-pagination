import {
  SIZE_LEVELS,
  ILLUS_RATIO,
  NON_BLANK_CHAR_REG_EXP
} from './configs';
import {
  isArrayType,
  isNumberType,
  isTextualItem,
  checkParagraphData,
  checkHeadlineData,
  checkIllusData,
  checkPagebreakData,
  removeExtraTextSpace,
  getBoundaryHeight,
  getBoxModelValue,
  createInlineStyleString,
  createHtmlString,
  createTextualHtml,
  createIllusHtml,
  checkBrowserEnvironment,
  checkViewportDom,
  handleCellSplit,
  createElement
} from './utilities';


function Layout(size) {
  this.data = [];
  this.pageGroup = [];
  this.pageMap = {};
  if (size) {
    this.updateSize(size);
  }
}


Layout.prototype = {
  constructor: Layout,

  size: SIZE_LEVELS[1],
  dom: { viewport: null },
  viewportSize: { w: 0, h: 0 },

  log: function (message) {
    console.log(message);
  },

  createHtmlOutput: function (item) {
    switch (item.type) {
      case 'headline':
        return createTextualHtml(item);
      case 'paragraph':
        return createTextualHtml(item);
      case 'illus':
        return createIllusHtml(item);
      default:
        return '';
    }
  },

  wrapPageContentHtml: function (page) {
    const pageContentHtml = createHtmlString(
      'div',
      {
        'style': createInlineStyleString({
          'overflow': 'hidden',
          'height': `${page.height}px`
        })
      },
      page.html
    );

    const pageWrapperHtml = createHtmlString(
      'div',
      {
        'style': createInlineStyleString({
          'width': `${this.viewportSize.w}px`,
          'height': `${this.viewportSize.h}px`
        })
      },
      pageContentHtml
    );

    return pageWrapperHtml;
  },

  calculateOffset: function (lineHeight, restHeight) {
    let height = restHeight;
    if (restHeight > this.viewportSize.h) {
      height = this.viewportSize.h;
    }
    const lines = Math.floor(height / lineHeight);
    return {
      lines,
      textOffset: lines * lineHeight,
    }
  },

  getParagraphClassName: function () {
    return `paragraph-${this.size}`;
  },
  getHeadlineClassName: function (level) {
    return `headline-${this.size} headline-level-${level}`;
  },
  getIllusClassName: function () {
    return `illus-${this.size}`;
  },

  getTextualElmentBaseline: function (element) {
    const {
      lineHeight,
      height,
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom
    } = getBoxModelValue(element);

    const textHeight = height;
    const lines = Math.ceil(textHeight / lineHeight);
    const actualLineHeight = textHeight / lines;

    return {
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom,

      computedLines: lines,
      computedLineHeight: actualLineHeight,

      lineHeight,
      textHeight: textHeight,
      minContainableHeight: lineHeight + paddingTop,
      contentHeight: height,
      minContentHeight: height + paddingTop,
      completeHeight: height + paddingV + marginBottom,
    }
  },


  calculateZoomedSize: function (img) {
    const origWidth = parseInt(img.origWidth, 10);
    const origHeight = parseInt(img.origHeight, 10);

    const width = this.viewportSize.w * ILLUS_RATIO[this.size];
    let fitRatio = width / origWidth;
    if (fitRatio > 1) { fitRatio = 1; }

    return {
      zoomedWidth: Math.floor(origWidth * fitRatio),
      zoomedHeight: Math.floor(origHeight * fitRatio)
    }
  },


  getGraphicElementBaseline: function (element, img) {
    const origWidth = parseInt(img.origWidth, 10);
    const origHeight = parseInt(img.origHeight, 10);
    const {
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom
    } = getBoxModelValue(element);

    const width = this.viewportSize.w * ILLUS_RATIO[this.size];
    const height = this.viewportSize.h - paddingV;
    const hRatio = width / origWidth;
    const vRatio = height / origHeight;
    const fitRatio = Math.min(hRatio, vRatio);
    let zoomLevel = fitRatio;
    if (fitRatio > 1) { zoomLevel = 1; }

    const zoomedWidth = Math.floor(origWidth * zoomLevel);
    const zoomedHeight = Math.floor(origHeight * zoomLevel);

    return {
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom,

      zoomedWidth,
      zoomedHeight,
      minContainableHeight: zoomedHeight + paddingV,
      contentHeight: zoomedHeight + paddingV,
      minContentHeight: zoomedHeight + paddingV,
      completeHeight: zoomedHeight + paddingV + marginBottom
    }
  },


  pushEmptyPage: function () {
    this.pageGroup.push({
      index: this.pageGroup.length,
      height: 0,
      html: '',
      boundaryFrom: null,
      boundaryTo: null,
      items: []
    });
  },


  pushToNextPage: function (item) {
    if (item.baseline.minContentHeight > this.viewportSize.h) {
      /* 无法在下一页完整显示 */
      this.pushEmptyPage();
      this.pageGroup[this.pageGroup.length - 1].boundaryFrom = {
        id: item.id,
        type: item.type
      }
      this.paginateText(item);
    } else {
      const nextPageIndex = this.pageGroup.length;
      this.pageGroup.push({
        index: nextPageIndex,
        height: item.height,
        html: this.createHtmlOutput(item),
        boundaryFrom: { id: item.id, type: item.type },
        boundaryTo: null,
        items: [item]
      });
      this.pageMap[item.id] = nextPageIndex;
    }
  },


  paginateText: function (item, prevOffset = 0, prevLines = 0) {
    let page = this.pageGroup[this.pageGroup.length - 1];
    const {
      paddingTop,
      computedLineHeight,
      computedLines,
      minContentHeight,
      completeHeight
    } = item.baseline;

    const restHeight = this.viewportSize.h - page.height;
    const restTextHeight = restHeight - paddingTop;
    const { lines, textOffset } = this.calculateOffset(computedLineHeight, restTextHeight);
    const offsetHeight = textOffset + paddingTop;

    //当前页
    const itemInCurrentPage = Object.assign({}, item, {
      offset: prevOffset,
      lines: lines,
      linesOffset: prevLines,
    });
    page.items.push(itemInCurrentPage);
    page.html += this.createHtmlOutput(itemInCurrentPage);
    page.height = page.height + offsetHeight;
    page.html = this.wrapPageContentHtml(page);
    page.boundaryTo = {
      id: item.id,
      type: item.type,
      paginated: true
    };
    if (prevOffset) {
      const lastPage = this.pageGroup[this.pageGroup.length - 2];
      page.boundaryFrom = lastPage.boundaryTo;
      this.pageMap[item.id].push(page.index);
    } else {
      this.pageMap[item.id] = [page.index];
    }

    //下一页能否显示完剩余内容
    if ((minContentHeight - offsetHeight - prevOffset) > this.viewportSize.h) {
      this.pushEmptyPage();
      this.paginateText(item, offsetHeight + prevOffset, lines + prevLines);
    } else {
      let heightInNextPage = completeHeight - offsetHeight - prevOffset;
      const itemInNextPage = Object.assign({}, item, {
        offset: offsetHeight + prevOffset,
        lines: computedLines - (lines + prevLines),
        linesOffset: lines + prevLines,
      });
      const nextPageIndex = this.pageGroup.length;
      this.pageGroup.push({
        index: nextPageIndex,
        height: heightInNextPage,
        html: this.createHtmlOutput(itemInNextPage),
        boundaryFrom: {
          id: item.id,
          type: item.type,
          paginated: true
        },
        boundaryTo: null,
        items: [itemInNextPage]
      });
      this.pageMap[item.id].push(nextPageIndex);
    }
  },


  handleText: function (rawItem, node) {
    const baseline = this.getTextualElmentBaseline(node);
    const {
      minContainableHeight,
      contentHeight,
      minContentHeight,
      completeHeight
    } = baseline;

    let item = Object.assign({}, rawItem, {
      height: completeHeight,
      offset: 0,
      baseline: baseline
    });

    let page = this.pageGroup[this.pageGroup.length - 1];
    const restHeight = this.viewportSize.h - page.height;

    //是否有剩余空间
    if (restHeight > 0) {
      //剩余空间是否可以容纳下至少一行的文本内容
      if (restHeight >= minContainableHeight) {
        //是否可以容纳下整段高度
        if (restHeight >= minContentHeight) {
          /* 直接添加到当前页 */
          const boundary = [
            restHeight,
            minContentHeight,
            contentHeight,
            completeHeight
          ];
          const boundaryHeight = getBoundaryHeight(restHeight, boundary);
          page.items.push(item);
          page.html += this.createHtmlOutput(item);
          page.height = page.height + boundaryHeight;
          if (page.items.length === 1) {
            page.boundaryFrom = {
              id: item.id,
              type: item.type
            };
          }
          this.pageMap[item.id] = page.index;
        } else {
          /* 添加到当前页并处理分页 */
          if (page.items.length === 0) {
            page.boundaryFrom = {
              id: item.id,
              type: item.type
            }
          }
          this.paginateText(item);
        }
      } else {
        /* 添加到下一页 */
        const lastItem = page.items[page.items.length - 1];
        page.boundaryTo = {
          id: lastItem.id,
          type: lastItem.type
        };
        page.html = this.wrapPageContentHtml(page);
        this.pushToNextPage(item);
      }
    } else {
      /* 添加到下一页 */
      const lastItem = page.items[page.items.length - 1];
      page.boundaryTo = {
        id: lastItem.id,
        type: lastItem.type
      };
      page.html = this.wrapPageContentHtml(page);
      this.pushToNextPage(item);
    }
  },

  handleIllus: function (rawItem, node) {
    const baseline = this.getGraphicElementBaseline(node, rawItem.data.img);
    const {
      minContainableHeight,
      contentHeight,
      completeHeight
    } = baseline;

    let item = Object.assign({}, rawItem, {
      height: completeHeight,
      offset: 0,
      baseline: baseline,
      data: rawItem.data
    });

    let page = this.pageGroup[this.pageGroup.length - 1];
    const restHeight = this.viewportSize.h - page.height;

    //是否有剩余空间
    if (restHeight > 0) {
      //剩余空间是否可以容纳下图片
      if (restHeight >= minContainableHeight) {
        /* 添加到当前页 */
        const boundary = [
          restHeight,
          minContainableHeight,
          contentHeight,
          completeHeight
        ];
        const boundaryHeight = getBoundaryHeight(restHeight, boundary);
        page.items.push(item);
        page.html += this.createHtmlOutput(item);
        page.height = page.height + boundaryHeight;
        if (page.items.length === 1) {
          page.boundaryFrom = {
            id: item.id,
            type: item.type
          };
        }
        this.pageMap[item.id] = page.index;
      } else {
        /* 添加到下一页 */
        const lastItem = page.items[page.items.length - 1];
        page.boundaryTo = {
          id: lastItem.id,
          type: lastItem.type
        };
        page.html = this.wrapPageContentHtml(page);
        this.pushToNextPage(item);
      }
    } else {
      /* 添加到下一页 */
      const lastItem = page.items[page.items.length - 1];
      page.boundaryTo = {
        id: lastItem.id,
        type: lastItem.type
      };
      page.html = this.wrapPageContentHtml(page);
      this.pushToNextPage(item);
    }
  },

  handlePagebreak: function (isLayoutFinished) {
    let page = this.pageGroup[this.pageGroup.length - 1];
    if (!page.html) { return; }
    const lastItem = page.items[page.items.length - 1];
    page.boundaryTo = {
      id: lastItem.id,
      type: lastItem.type
    };
    page.html = this.wrapPageContentHtml(page);
    if (!isLayoutFinished) {
      this.pushEmptyPage();
    }
  },


  handleRenderIllus: function (i, isPrecomputed) {
    if (isPrecomputed) {
      const size = this.calculateZoomedSize(i.data.img);
      return createHtmlString(
        'div',
        { 'class': i.className },
        createHtmlString(
          'img',
          {
            'src': i.data.img.src,
            'style': createInlineStyleString({
              'width': `${size.zoomedWidth}px`,
              'height': `${size.zoomedHeight}px`
            })
          }
        )
      );
    }
    return createHtmlString(
      'div',
      { 'class': i.className },
    );
  },


  handleRenderPagebreak: function (isPrecomputed) {
    if (isPrecomputed) {
      this.log(`pagebreak will be ignored when render without pagination.`);
      return '';
    }
    return createHtmlString('div');
  },


  /**
   * 初始化待排版内容
   * @param {array} data 
   * @param {boolean} isPrecomputed 
   */
  init: function (data, isPrecomputed) {
    var html = '';
    this.data = data.filter((i, index) => {
      if (checkParagraphData(i)) {
        i.data.text = removeExtraTextSpace(i.data.text);
        i.className = this.getParagraphClassName();
        html += createHtmlString(
          'div',
          { 'class': i.className },
          i.data.text
        );
        return true;
      } else if (checkHeadlineData(i)) {
        i.data.text = removeExtraTextSpace(i.data.text);
        i.className = this.getHeadlineClassName(i.data.level);
        html += createHtmlString(
          'div',
          { 'class': i.className },
          i.data.text
        );
        return true;
      } else if (checkIllusData(i)) {
        i.className = this.getIllusClassName();
        html += this.handleRenderIllus(i, isPrecomputed);
        return true;
      } else if (checkPagebreakData(i)) {
        html += this.handleRenderPagebreak(isPrecomputed);
        return true;
      }
      this.log(`an illegal format item of index:${index} is among data that will be ignored.`);
      return false;
    });
    return html;
  },


  checkBeforeRender: function (data) {
    if (!isArrayType(data)) {
      this.log('param is not an array in the render method.');
      return false;
    }
    if (data.length === 0) {
      this.log('there is nothing to render.');
      return false;
    }
    if (!this.checkEnvironment()) { 
      return false;
    }
    return true;
  },


  /**
   * 分页排版渲染
   * @param {Array} data 源数据
   * @returns {Array} 排版后的数据
   */
  render: function (data) {
    if (!this.checkBeforeRender(data)) { return null; }

    // 生成 html 字符串，添加至 DOM
    this.dom.viewport.innerHTML = this.init(data, false);

    // 排版分页
    this.pushEmptyPage();
    var nodes = this.dom.viewport.childNodes;
    for (let i = 0, len = nodes.length; i < len; i++) {
      let item = this.data[i];
      switch (item.type) {
        case 'paragraph':
          this.handleText(item, nodes[i]);
          break;
        case 'headline':
          this.handleText(item, nodes[i]);
          break;
        case 'illus':
          this.handleIllus(item, nodes[i]);
          break;
        case 'pagebreak':
          if (i !== len - 1) { this.handlePagebreak(); }
          break;
        default:
          break;
      }
    }
    this.handlePagebreak(true);

    this.dom.viewport.innerHTML = '';
    return this.pageGroup;
  },


  /**
   * 竖向排版
   * @param {Array} data 源数据
   * @returns {string} 排版后的 html 字符串
   */
  renderWithoutPagination: function (data) {
    if (!this.checkBeforeRender(data)) { return null; }
    return this.init(data, true);
  },


  /**
   * 环境检查
   */
  checkEnvironment: function () {
    if (!checkBrowserEnvironment()) {
      this.log('web browser environment is not detected.');
      return false;
    }

    if (!this.dom.viewport) {
      this.dom.viewport = checkViewportDom();
    }
    try {
      const s = getBoxModelValue(this.dom.viewport);
      if (s.boxSizing === 'content-box') {
        this.viewportSize.w = s.width;
        this.viewportSize.h = s.height;
        this.reset();
        return true;
      } else {
        this.log('use content-box box model instead of border-box which has an inconsistent issue in IE.');
        return false;
      }
    } catch (error) {
      this.log(`viewport DOM is not available.`);
      return false;
    }
  },


  /**
   * 更新排版尺寸
   * @param {string} newSize 
   */
  updateSize: function (newSize) {
    if (SIZE_LEVELS.indexOf(newSize) > -1 && this.size !== newSize) {
      this.__proto__.size = newSize;
      this.reset();
    }
  },


  /**
   * 重置
   */
  reset: function () {
    this.data.length = 0;
    this.pageGroup.length = 0;
    this.pageMap = {};
  },


  /**
   * 查找段落
   * @param {string} itemId
   * @param {number} charOffset 字符偏移量
   * @returns {number|null} 返回匹配结果，页码索引或 null (未匹配)
   */
  findItem: function (itemId, charOffset) {
    const pagePosition = this.pageMap[itemId];
    if (typeof pagePosition === 'undefined') {
      this.log('item not found.');
      return null;
    }

    if (isNumberType(pagePosition)) {
      return pagePosition;
    } else if (isArrayType(pagePosition)) {
      if (charOffset) {
        charOffset = parseInt(charOffset, 10);
        if (!isNumberType(charOffset) || charOffset < 0) {
          this.log('invalid charOffset.');
          return null;
        }

        const edges = pagePosition.map(pageIndex => this.extractFromPage(pageIndex));
        const result = edges.filter(division => {
          if (
            itemId === division.itemFrom.id
            && division.itemFrom.paginated
          ) {
            return (
              charOffset >= division.itemFrom.charFrom
              && charOffset <= division.itemFrom.charTo
            );
          } else if (
            itemId === division.itemTo.id
            && division.itemTo.paginated
          ) {
            return (
              charOffset >= division.itemTo.charFrom
              && charOffset <= division.itemTo.charTo
            );
          }
          return false;
        });
        if (result.length > 0) {
          return result[0].pageIndex;
        }
        this.log('charOffset is not matched.');
        return pagePosition[0];
      }
      return pagePosition[0];
    }
  },


  /**
   * 查找有效的段落
   * 指定 itemId 未找到时，尝试匹配一个有效 itemId
   * @param {string} itemId
   * @param {number} charOffset 字符偏移量
   * @returns {number|null} 返回匹配结果，页码索引或 null (未匹配)
   */
  findValidItem: function (itemId, charOffset) {
    if (isNumberType(this.pageMap[itemId])) {
      return this.pageMap[itemId];
    }
    // 未找到对应段落时，尝试向后匹配最相邻的段落
    const value = parseInt(itemId, 10);
    let result = null;
    for (let i = 0, len = this.data.length; i < len; i++) {
      const num = parseInt(this.data[i].id, 10);
      if (value === num) {
        result = num;
        break;
      } else if (i === 0) {
        if (value === num) {
          result = num;
          break;
        }
      } else {
        if (
          value > parseInt(this.data[i - 1].id, 10)
          && value <= num
        ) {
          result = num;
          break;
        }
      }
    }
    return this.findItem(result, charOffset);
  },



  /**
   * 文本分割
   * @param {Object} item 
   * @param {Array} lineRange [lineFrom, lineTo] 或 [lineFrom]
   */
  handleTextDivision: function (item, lineRange) {
    const split = handleCellSplit(item.data.text);
    var element = createElement(
      'div',
      { class: item.className },
      split.html
    );
    this.dom.viewport.appendChild(element);

    // 获取一个非空白符的字符索引
    function getValidCharIndex(index, direction) {
      if (index < 0 || index > split.length - 1) {
        return null;
      }
      if (split.group[index].match(NON_BLANK_CHAR_REG_EXP)) {
        return index;
      } else {
        return getValidCharIndex(index + direction, direction);
      }
    }

    function isValidLine(l) {
      return (
        isNumberType(l)
        && l > 0
        && l <= item.baseline.computedLines
      );
    }

    function guessPos(targetLine) {
      let startPos = 0;
      let endPos = split.length;
      let halfPos = getValidCharIndex(Math.floor((startPos + endPos) / 2), 1);

      function guessLine() {
        if (halfPos === null) { return false; }

        let line = Math.ceil(
          (element.childNodes[halfPos].offsetTop - item.baseline.paddingTop) / item.baseline.computedLineHeight
        );
        if (!isValidLine(line)) { return false; }

        if (line < targetLine) {
          startPos = halfPos;
          halfPos = getValidCharIndex(Math.floor((startPos + endPos) / 2), 1);
          return guessLine();
        } else if (line > targetLine) {
          endPos = halfPos;
          halfPos = getValidCharIndex(Math.floor((startPos + endPos) / 2), -1);
          return guessLine();
        } else if (line === targetLine) {
          return true;
        } else {
          return false;
        }
      }


      const lineGuessResult = guessLine();
      if (!lineGuessResult) { return null; }


      let charPos = halfPos;
      function guessChar() {
        if (charPos === null) { return false; }

        let currentLine = Math.ceil(
          (element.childNodes[charPos].offsetTop - item.baseline.paddingTop)
          / item.baseline.computedLineHeight
        );
        if (!isValidLine(currentLine)) { return false; }

        if (currentLine >= targetLine) {
          charPos = getValidCharIndex(charPos - 1, -1);
          return guessChar();
        } else {
          return true;
        }
      }

      const charGuessResult = guessChar();
      if (!charGuessResult) { return null; }
      charPos = getValidCharIndex(charPos + 1, 1);
      return charPos;
    }

    try {
      let cellFrom = 0, cellTo = split.length;
      if (lineRange.length === 2) {
        if (lineRange[0] === 0) {
          // 截取文本前半部分
          cellTo = guessPos(lineRange[1]);
        } else {
          // 截取文本中间部分
          cellFrom = guessPos(lineRange[0]);
          cellTo = guessPos(lineRange[1]);
        }
      } else if (lineRange.length === 1) {
        // 截取文本后半部分
        cellFrom = guessPos(lineRange[0]);
      }

      const charTo = split.group.slice(0, cellTo).join('').length;

      return {
        id: item.id,
        charFrom: split.group.slice(0, cellFrom).join('').length + 1,
        charTo: charTo,
        charOffset: charTo,
        text: split.group.slice(cellFrom, cellTo).join(''),
      }
    } catch (error) {
      this.log(`Item ${item.id} text division: boundary guess is out of edge.`);
      return {
        id: item.id,
        charFrom: 1,
        charTo: split.length,
        charOffset: split.length,
        text: item.data.text,
      }
    }
  },



  /**
   * 提取页面中的纯文本
   * @param {number} pageIndex 页码索引
   * @param {string} separator 分隔符
   * @param {number} textLength 指定最大文本长度
   * @returns {string|null}
   */
  extractTextFromPage: function (pageIndex, separator = ' ', textLength) {
    const result = this.extractFromPage(pageIndex);
    if (result === null) { return ''; }

    // 拼接文本
    const text = result.textualItems.join(separator);
    var concatText = removeExtraTextSpace(text);
    if (isNumberType(textLength)) {
      concatText = concatText.slice(0, textLength);
    }

    return concatText;
  },



  /**
   * 提取页面内容
   * @param {number} pageIndex 页码索引
   * @returns {object|null}
   */
  extractFromPage: function (pageIndex) {
    if (this.pageGroup.length === 0) {
      this.log('nothing to extract.');
      return null;
    }
    if (pageIndex < 0 || pageIndex >= this.pageGroup.length) {
      this.log('invalid pageIndex.');
      return null;
    }

    const page = this.pageGroup[pageIndex];
    if (page.items.length === 0) {
      this.log('empty content in page.');
      return null;
    }

    const firstItem = page.items[0];
    const lastItemIndex = page.items.length - 1;
    const lastItem = page.items[lastItemIndex];

    let dividedQueue = []; // 需要分割的段
    let undividedPos = [0, lastItemIndex]; // 不需要分割的段
    let textArr = []; // 所有段的文本
    let undividedTextArr = null; // 未分割段的文本

    let itemFrom = { id: firstItem.id }; // 起止段
    let itemTo = { id: lastItem.id };

    // 检查页面的分页状态
    if (page.boundaryFrom.paginated) {
      // 页面起点分割：截取段的后半部分
      undividedPos[0]++;
      dividedQueue.push({
        item: firstItem,
        lineRange: [firstItem.linesOffset + 1]
      });
    }
    if (page.boundaryTo.paginated) {
      let line = lastItem.linesOffset + lastItem.lines;
      undividedPos[1]--;
      if (
        page.boundaryFrom.paginated
        && page.boundaryFrom.id === page.boundaryTo.id
      ) {
        // 页面首尾分割：截取段的中间部分
        dividedQueue[0].lineRange.push(line + 1);
      } else {
        // 页面结尾分割：截取段的前半部分
        dividedQueue.push({
          item: lastItem,
          lineRange: [0, line + 1]
        });
      }
    }

    // 处理未分割段的文本
    undividedTextArr = page.items
      .slice(undividedPos[0], undividedPos[1] + 1)
      .filter(i => isTextualItem(i.type))
      .map(i => i.data.text);

    // 处理需要分割段的文本
    function handleItem(division) {
      textArr.push(division.text);
      return {
        id: division.id,
        paginated: true,
        charFrom: division.charFrom,
        charTo: division.charTo,
        charOffset: division.charOffset,
        textLength: division.text.length,
      }
    }

    if (dividedQueue.length === 2) {
      // 页面首尾分割（首尾不同的段）
      itemFrom = handleItem(this.handleTextDivision(
        dividedQueue[0].item,
        dividedQueue[0].lineRange
      ));
      textArr.push(...undividedTextArr);
      itemTo = handleItem(this.handleTextDivision(
        dividedQueue[1].item,
        dividedQueue[1].lineRange
      ));
    } else if (dividedQueue.length === 1) {
      if (dividedQueue[0].lineRange.length === 2) {
        if (dividedQueue[0].lineRange[0] === 0) {
          // 页尾切分
          textArr.push(...undividedTextArr);
          itemTo = handleItem(this.handleTextDivision(
            dividedQueue[0].item,
            dividedQueue[0].lineRange
          ))
        } else {
          // 首尾切分（首尾相同的段）
          itemTo = handleItem(this.handleTextDivision(
            dividedQueue[0].item,
            dividedQueue[0].lineRange
          ));
          itemFrom = Object.assign({}, itemTo, {
            charOffset: itemTo.charTo - itemTo.textLength
          });
        }
      } else {
        // 页首切分
        itemFrom = handleItem(this.handleTextDivision(
          dividedQueue[0].item,
          dividedQueue[0].lineRange
        ));
        textArr.push(...undividedTextArr);
      }
    } else {
      // 页面未产生分页
      textArr.push(...undividedTextArr);
    }

    // 重置 DOM
    this.dom.viewport.innerHTML = '';

    return {
      pageIndex,
      itemFrom,
      itemTo,
      textualItems: textArr
    }
  },
}


export default Layout;