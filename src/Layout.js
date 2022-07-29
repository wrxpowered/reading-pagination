import {
  FORMAT,
  SIZE_LEVELS,
  ILLUS_RATIO,
  NON_BLANK_CHAR_REG_EXP,
  UNICODE_PUNCTUATION_REG_EXP,
} from './configs';
import {
  isArrayType,
  isNumberType,
  isStringType,
  isTextualItem,
  checkParagraphData,
  checkHeadlineData,
  checkIllusData,
  checkPagebreakData,
  removeExtraTextSpace,
  getPureText,
  getBoundaryHeight,
  getBoxModelValue,
  createInlineStyleString,
  createHtmlString,
  createTextualHtml,
  createIllusHtml,
  checkBrowserEnvironment,
  checkViewportDom,
  handleCellSplit,
  createElement,
  getAbstract,
} from './utilities';


function Layout(size) {
  this.data = [];
  this.lastDataLength = 0;
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

  getAbstract: function (...params) {
    return getAbstract(this.data, ...params);
  },

  _createHtmlOutput: function (item) {
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

  _wrapPageContentHtml: function (page) {
    const pageContentHtml = createHtmlString(
      'div',
      {
        'class': 'layout-page-content',
        'style': createInlineStyleString({
          'height': `${page.height}px`
        })
      },
      page.html
    );

    const pageWrapperHtml = createHtmlString(
      'div',
      {
        'class': 'layout-page-wrapper',
        'style': createInlineStyleString({
          'width': `${this.viewportSize.w}px`,
          'height': `${this.viewportSize.h}px`
        })
      },
      pageContentHtml
    );

    return pageWrapperHtml;
  },


  _getTextualElmentBaseline: function (element) {
    const {
      lineHeight,
      height,
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom
    } = getBoxModelValue(element);

    const lines = Math.ceil(height / lineHeight);
    const actualLineHeight = height / lines;

    return {
      paddingTop,
      paddingBottom,
      paddingV,
      marginBottom,

      computedLines: lines,
      computedLineHeight: actualLineHeight,

      lineHeight,
      minContainableHeight: lineHeight + paddingTop,
      minContentHeight: height + paddingTop,
      textHeight: height,
      contentHeight: height + paddingV,
      completeHeight: height + paddingV + marginBottom,
    }
  },


  _calculateZoomedSize: function (img) {
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


  _getGraphicElementBaseline: function (element, img) {
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


  _pushEmptyPage: function () {
    this.pageGroup.push({
      index: this.pageGroup.length,
      height: 0,
      html: '',
      boundaryFrom: null,
      boundaryTo: null,
      items: []
    });
  },


  _pushToNextPage: function (item) {
    if (item.baseline.minContentHeight > this.viewportSize.h) {
      /* 无法在下一页完整显示 */
      this._pushEmptyPage();
      this.pageGroup[this.pageGroup.length - 1].boundaryFrom = {
        id: item.id,
        type: item.type
      }
      this._paginateText(item);
    } else {
      const nextPageIndex = this.pageGroup.length;
      this.pageGroup.push({
        index: nextPageIndex,
        height: item.height,
        html: this._createHtmlOutput(item),
        boundaryFrom: { id: item.id, type: item.type },
        boundaryTo: null,
        items: [item]
      });
      this.pageMap[item.id] = nextPageIndex;
    }
  },


  _calculateTextOffset: function (lineHeight, restHeight) {
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


  _paginateText: function (item, prevOffset = 0, prevLines = 0) {
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
    const { lines, textOffset } = this._calculateTextOffset(computedLineHeight, restTextHeight);
    const offsetHeight = textOffset + paddingTop;

    //当前页
    const itemInCurrentPage = Object.assign({}, item, {
      offset: prevOffset,
      lines: lines,
      linesOffset: prevLines,
    });
    page.items.push(itemInCurrentPage);
    page.html += this._createHtmlOutput(itemInCurrentPage);
    page.height = page.height + offsetHeight;
    page.html = this._wrapPageContentHtml(page);
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
      this._pushEmptyPage();
      this._paginateText(item, offsetHeight + prevOffset, lines + prevLines);
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
        html: this._createHtmlOutput(itemInNextPage),
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


  _handleText: function (rawItem, node) {
    const baseline = this._getTextualElmentBaseline(node);
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
          page.html += this._createHtmlOutput(item);
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
          this._paginateText(item);
        }
      } else {
        /* 添加到下一页 */
        const lastItem = page.items[page.items.length - 1];
        page.boundaryTo = {
          id: lastItem.id,
          type: lastItem.type
        };
        page.html = this._wrapPageContentHtml(page);
        this._pushToNextPage(item);
      }
    } else {
      /* 添加到下一页 */
      const lastItem = page.items[page.items.length - 1];
      page.boundaryTo = {
        id: lastItem.id,
        type: lastItem.type
      };
      page.html = this._wrapPageContentHtml(page);
      this._pushToNextPage(item);
    }
  },

  _handleIllus: function (rawItem, node) {
    const baseline = this._getGraphicElementBaseline(node, rawItem.data.img);
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
        page.html += this._createHtmlOutput(item);
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
        page.html = this._wrapPageContentHtml(page);
        this._pushToNextPage(item);
      }
    } else {
      /* 添加到下一页 */
      const lastItem = page.items[page.items.length - 1];
      page.boundaryTo = {
        id: lastItem.id,
        type: lastItem.type
      };
      page.html = this._wrapPageContentHtml(page);
      this._pushToNextPage(item);
    }
  },

  _handlePagebreak: function (isLayoutFinished) {
    var lastPage = this.pageGroup[this.pageGroup.length - 1];
    if (!lastPage.html) { return; }

    const lastItem = lastPage.items[lastPage.items.length - 1];
    lastPage.boundaryTo = {
      id: lastItem.id,
      type: lastItem.type
    };
    lastPage.html = this._wrapPageContentHtml(lastPage);

    // pagebreak item in the last will create an empty page which has no necessary.
    if (!isLayoutFinished) {
      this._pushEmptyPage();
    }
  },


  /**
   * necessary environment detection
   * - check: browser environment, DOM node template;
   * - process: viewportSize update, data reset;
   */
  _checkEnvironment: function () {
    if (!checkBrowserEnvironment()) {
      this.log('web browser environment is not detected.');
      return false;
    }

    if (!this.dom.viewport) {
      this.dom.viewport = checkViewportDom();
    }

    const value = getBoxModelValue(this.dom.viewport);
    if (value.boxSizing === 'content-box') {
      this.viewportSize.w = value.width;
      this.viewportSize.h = value.height;
      return true;
    } else {
      this.log('use content-box box model instead of border-box, avoid an inconsistent issue in IE browser.');
      return false;
    }
  },


  /**
   * check source data in render method
   * @param {array} data should be a valid array
   */
  _checkSourceData: function (data) {
    if (!isArrayType(data)) {
      this.log('the param should be an array.');
      return false;
    }
    if (data.length === 0) {
      this.log('there is nothing to render.');
      return false;
    }
    return true;
  },


  _initIllusData: function (i, isPrecomputed) {
    if (isPrecomputed) {
      const size = this._calculateZoomedSize(i.data.img);
      return createHtmlString(
        'div',
        { 'class': i.className, 'data-id': i.id },
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
      { 'class': i.className, 'data-id': i.id },
    );
  },


  _initPagebreakData: function (isPrecomputed) {
    if (isPrecomputed) {
      this.log(`pagebreak will be ignored when render without pagination.`);
      return '';
    }
    return createHtmlString('div');
  },


  /**
   * create html string from source data
   * 
   * format data, then transfer source data to html string.
   * @param {array} data source data
   * @param {boolean} isPrecomputed different render mode
   */
  _initData: function (data, isPrecomputed) {
    var html = '';
    this.lastDataLength = this.data.length;
    this.data.push(...data.filter((i, index) => {
      if (checkParagraphData(i)) {
        i.data.text = removeExtraTextSpace(i.data.text);
        i.division = handleCellSplit(i.data.text, this.size, i.type);
        i.className = `paragraph-${this.size}`;
        html += createHtmlString(
          'div',
          { 'class': i.className, 'data-id': i.id },
          i.division.html
        );
        return true;
      } else if (checkHeadlineData(i)) {
        i.data.text = removeExtraTextSpace(i.data.text);
        i.division = handleCellSplit(i.data.text, this.size, i.type, i.data.level);
        i.className = `headline-${this.size} headline-level-${i.data.level}`;
        html += createHtmlString(
          'div',
          { 'class': i.className, 'data-id': i.id },
          i.division.html
        );
        return true;
      } else if (checkIllusData(i)) {
        i.className = `illus-${this.size}`;
        html += this._initIllusData(i, isPrecomputed);
        return true;
      } else if (checkPagebreakData(i)) {
        html += this._initPagebreakData(isPrecomputed);
        return !isPrecomputed;
      }
      this.log(`item of index: ${index} will be ignored which is invalid format.`);
      return false;
    }));
    return html;
  },


  /**
   * compose data with pagination
   * @param {array} data source data
   * @param {boolean} isUnfinished continue with last render data when set true
   * @returns {array} paginated content
   */
  render: function (data, isUnfinished) {
    if (!this._checkSourceData(data)) { return []; }
    if (!this._checkEnvironment()) { return null; }
    if (isUnfinished) {
      // remove wrapper html of last page
      let lastPage = this.pageGroup[this.pageGroup.length - 1];
      if (lastPage) {
        lastPage.html = lastPage.items.map(i => this._createHtmlOutput(i)).join('');
      }
    } else {
      this.reset();
    }

    // create html string and append to template DOM node
    try {
      this.dom.viewport.innerHTML = this._initData(data, false);
    } catch (error) {
      this.log('error occurs when init source data.');
      return [];
    }

    // paginate content
    if (this.pageGroup.length === 0) { this._pushEmptyPage(); }
    var nodes = this.dom.viewport.childNodes;
    for (let i = 0, len = nodes.length; i < len; i++) {
      let item = this.data[i + this.lastDataLength];
      switch (item.type) {
        case 'paragraph':
          this._handleText(item, nodes[i]);
          break;
        case 'headline':
          this._handleText(item, nodes[i]);
          break;
        case 'illus':
          this._handleIllus(item, nodes[i]);
          break;
        case 'pagebreak':
          if (i !== len - 1) { this._handlePagebreak(); }
          break;
        default:
          break;
      }
    }
    this._handlePagebreak(true);

    this.dom.viewport.innerHTML = '';
    return this.pageGroup;
  },


  /**
   * compose data without pagination
   * @param {Array} data source data
   * @returns {string} html string
   */
  renderWithoutPagination: function (data) {
    if (!this._checkSourceData(data)) { return []; }
    if (!this._checkEnvironment()) { return null; }

    try {
      return this._initData(data, true);
    } catch (error) {
      this.log('error occurs when init source data.');
      return '';
    }
  },


  /**
   * change content level size and reset
   * @param {string} newSize 
   */
  updateSize: function (newSize) {
    if (SIZE_LEVELS.indexOf(newSize) > -1) {
      if (Layout.prototype.size !== newSize) {
        Layout.prototype.size = newSize;
        this.reset();
      }
    } else {
      this.log('invalid size level.');
    }
  },


  /**
   * data reset
   */
  reset: function () {
    this.data.length = 0;
    this.pageGroup.length = 0;
    this.pageMap = {};
  },


  /**
   * locate item in which page
   * @param {string} itemId
   * @param {number} charOffset char location
   * @returns {number|null} return the target page index, or null
   */
  findItem: function (itemId, charOffset) {
    itemId = String(itemId);
    const pagePosition = this.pageMap[itemId];

    if (isNumberType(pagePosition)) {
      return pagePosition;
    } else if (isArrayType(pagePosition)) {
      if (charOffset) {
        charOffset = parseInt(charOffset, 10);
        if (!isNumberType(charOffset) || charOffset < 0) {
          this.log('invalid charOffset param.');
          return pagePosition[0];
        }

        const edges = pagePosition.map(pageIndex => this.extractFromPage(pageIndex));
        const result = edges.filter(division => {
          if (division === null) { return false; }
          if (itemId === division.itemTo.id) {
            if (division.itemTo.charOffset) {
              return charOffset <= division.itemTo.charOffset;
            } else {
              return true;
            }
          } else {
            return true;
          }
        });
        if (result.length > 0) {
          return result[0].pageIndex;
        }

        this.log('charOffset is not matched.');
        return pagePosition[0];
      }
      this.log('charOffset is not specified, first of pages will be returned.')
      return pagePosition[0];
    } else {
      this.log('item not found.');
      return null;
    }
  },


  /**
   * same as the method `findItem`
   * if the itemId is not exist, try to match a valid neighbouring itemId backward.
   * @param {string} itemId
   * @param {number} charOffset
   * @returns {number|null}
   */
  findValidItem: function (itemId, charOffset) {
    if (typeof this.pageMap[itemId] !== 'undefined') {
      return this.findItem(itemId, charOffset);
    }

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
   * handle the boundary of the pagination position
   * @param {object} item item of this.data
   * @param {array} lineRange [lineFrom, lineTo] 或 [lineFrom]
   * @returns {object} exact division info
   */
  _handleDivision: function (item, lineRange) {
    const split = item.division;
    this.dom.viewport.innerHTML = '';
    var element = createElement(
      'div',
      { class: item.className },
      split.html
    );
    this.dom.viewport.appendChild(element);
    const childNodes = element.querySelectorAll('.word');

    // get a non-blank char index forward or backward
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
          (childNodes[halfPos].offsetTop - item.baseline.paddingTop) / item.baseline.computedLineHeight
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


      let charPos = getValidCharIndex(halfPos - 1, -1);
      function guessChar() {
        if (charPos === null) { return false; }

        let currentLine = Math.ceil(
          (childNodes[charPos].offsetTop - item.baseline.paddingTop)
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
      return charPos;
    }

    try {
      let cellFrom = 0, cellTo = split.length - 1;
      if (lineRange.length === 2) {
        if (lineRange[0] === 0) {
          // slice front part of paragraph
          cellTo = guessPos(lineRange[1]);
        } else {
          // slice middle part of paragraph
          cellFrom = getValidCharIndex(guessPos(lineRange[0]) + 1, 1);
          cellTo = guessPos(lineRange[1]);
        }
      } else if (lineRange.length === 1) {
        // slice last part of paragraph
        cellFrom = getValidCharIndex(guessPos(lineRange[0]) + 1, 1);
      }

      return {
        id: item.id,
        charFrom: split.group.slice(0, cellFrom).join('').length,
        charTo: split.group.slice(0, cellTo + 1).join('').length - 1,
        text: split.group.slice(cellFrom, cellTo + 1).join(''),
      }
    } catch (error) {
      this.log(`Item ${item.id} text division: boundary guess is out of edge.`);
      return {
        id: item.id,
        charFrom: 0,
        charTo: split.length - 1,
        charOffset: split.length - 1,
        text: item.data.text,
      }
    }
  },



  /**
   * extract textual content from a page
   * 
   * if a page is paginated, the divided text content will be captured.
   * @param {number} pageIndex
   * @returns {object|null}
   */
  extractFromPage: function (pageIndex) {
    if (this.pageGroup.length === 0) {
      this.log('there is nothing to extract.');
      return null;
    }
    if (pageIndex < 0 || pageIndex >= this.pageGroup.length) {
      this.log(`invalid pageIndex of ${pageIndex} which is not found.`);
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

    let dividedQueue = []; // item need to divide
    let undividedPos = [0, lastItemIndex]; // item without pagination
    let undividedTextArr = null; // undivided text values
    let textArr = []; // all text values of the page

    let itemFrom = { id: firstItem.id };
    let itemTo = { id: lastItem.id };

    // check pagination status of the page
    if (page.boundaryFrom.paginated) {
      // will capture last part of paragraph
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
        // will capture middle part of paragraph
        dividedQueue[0].lineRange.push(line + 1);
      } else {
        // will capture front part of paragraph
        dividedQueue.push({
          item: lastItem,
          lineRange: [0, line + 1]
        });
      }
    }


    /**
     * handle undivided text values
     */
    undividedTextArr = page.items
      .slice(undividedPos[0], undividedPos[1] + 1)
      .filter(i => isTextualItem(i.type))
      .map(i => getPureText(i.data.text));


    /**
     * handle divided text values
     */
    function createDivision(division) {
      textArr.push(division.text);
      return {
        id: division.id,
        paginated: true,
        charFrom: division.charFrom,
        charTo: division.charTo,
      }
    }
    function handleItemFrom(fromData) {
      return {
        ...fromData,
        charOffset: fromData.charFrom
      }
    }
    function handleItemTo(toData) {
      return {
        ...toData,
        charOffset: toData.charTo
      }
    }
    if (dividedQueue.length === 2) {
      /**
       * page beginning and ending division with different paragraphs
       * - itemFrom: last part of paragraph A
       * - itemTo: front part of paragraph B
       */
      itemFrom = handleItemFrom(createDivision(this._handleDivision(
        dividedQueue[0].item,
        dividedQueue[0].lineRange
      )));
      textArr.push(...undividedTextArr);
      itemTo = handleItemTo(createDivision(this._handleDivision(
        dividedQueue[1].item,
        dividedQueue[1].lineRange
      )));
    } else if (dividedQueue.length === 1) {
      if (dividedQueue[0].lineRange.length === 2) {
        if (dividedQueue[0].lineRange[0] === 0) {
          /**
           * page ending division only
           * - itemTo: front part of paragraph
           */
          textArr.push(...undividedTextArr);
          itemTo = handleItemTo(createDivision(this._handleDivision(
            dividedQueue[0].item,
            dividedQueue[0].lineRange
          )));
        } else {
          /**
           * page beginning and ending division with same paragraph
           * - itemFrom & itemTo: middle part of paragraph
           */
          itemTo = handleItemTo(createDivision(this._handleDivision(
            dividedQueue[0].item,
            dividedQueue[0].lineRange
          )));
          // charOffset of itemTo include current page's text length
          itemFrom = handleItemFrom(itemTo);
        }
      } else {
        /**
         * page beginning division only
         * - itemFrom: last part of paragraph
         */
        itemFrom = handleItemFrom(createDivision(this._handleDivision(
          dividedQueue[0].item,
          dividedQueue[0].lineRange
        )));
        textArr.push(...undividedTextArr);
      }
    } else {
      /**
       * page has no pagination
       */
      textArr.push(...undividedTextArr);
    }


    this.dom.viewport.innerHTML = ''; // reset DOM
    return {
      pageIndex,
      itemFrom,
      itemTo,
      textualItems: textArr
    }
  },


  highlightKeywordFromPage: function (pageIndex, keyword) {
    // 参数检查
    const page = this.pageGroup[pageIndex];
    if (!page) { return ''; }
    if (!isStringType(keyword)) { return page.html; }

    // 检索词格式化
    const reg = UNICODE_PUNCTUATION_REG_EXP;
    keyword = keyword.replace(reg, '');
    if (!keyword) { return page.html; }
    keyword = keyword.toLowerCase();

    // 创建一个不包含空白与标点符的文本段落副本
    let wholePagePureText = '';
    let pureDivision = [];
    page.items.reduce((prevOffset, i) => {
      if (i.type === FORMAT.PARAGRAPH || i.type === FORMAT.HEADLINE) {
        const pureGroup = i.division.group.map(word => word.replace(reg, ''));
        const pureText = pureGroup.join('').toLowerCase();
        const offset = prevOffset + pureText.length;
        wholePagePureText += pureText;
        pureDivision.push({
          group: pureGroup,
          html: i.division.html,
          pureText: pureText,
          offsetFrom: prevOffset,
        });
        return offset;
      } else {
        pureDivision.push(null);
        return prevOffset;
      }
    }, 0);

    // 整页纯文本匹配
    let charPos = []; // 匹配到的字符位置集
    let pos = wholePagePureText.indexOf(keyword);
    while (pos > -1) {
      charPos.push(pos);
      pos = wholePagePureText.indexOf(keyword, pos + 1);
    }

    // 整页匹配结果细化到段落内的匹配结果
    if (charPos.length > 0) {
      let charPosMap = {};
      pureDivision.forEach((para, paraIndex) => {
        if (!para) { return; } // 忽略非文本段落

        // 检查段落内是否包含匹配结果
        const paraFrom = para.offsetFrom;
        const paraTo = para.offsetFrom + para.pureText.length - 1;
        charPos.forEach(pos => {
          const charFrom = pos;
          const charTo = pos + keyword.length - 1;

          const addToMap = (value) => {
            if (charPosMap[paraIndex]) { 
              charPosMap[paraIndex].push(value); 
            } else {
              charPosMap[paraIndex] = [value];
            }
          }

          if (charFrom >= paraFrom && charTo <= paraTo) {
            // 匹配结果为段落子集
            addToMap({ isAcross: false, from: charFrom, to: charTo });
          } else if (charFrom < paraFrom && charTo >= paraFrom && charTo <= paraTo) {
            // 匹配结果与段落交集：跨段首
            addToMap({ isAcross: true, from: paraFrom, to: charTo });
          } else if (charFrom >= paraFrom && charFrom <= paraTo && charTo > paraTo) {
            // 匹配结果与段落交集：跨段尾
            addToMap({ isAcross: true, from: charFrom, to: paraTo });
          } else if (charFrom < paraFrom && charTo > paraTo) {
            // 匹配结果为段落父集
            addToMap({ isAcross: true, from: paraFrom, to: paraTo });
          }
        });

        // 匹配对应的单词
        if (charPosMap[paraIndex]) {
          let wordPos = []; // 匹配到的单词位置集
          let wordPosMap = {};
          para.group.reduce((sum, word, index) => {
            if (!word) { return sum; }
            const start = charPosMap[paraIndex].filter(i => (
              i.from >= sum && i.from <= sum + word.length - 1
            ));
            if (start.length > 0) {
              wordPosMap[start[0].from] = [index];
            }
            const end = charPosMap[paraIndex].filter(i => (
              i.to >= sum && i.to <= sum + word.length - 1
            ));
            if (end.length > 0) {
              wordPosMap[end[0].from].push(index);
            }
            return sum + word.length;
          }, para.offsetFrom);

          for (let prop in wordPosMap) {
            if (wordPosMap[prop].length === 2) {
              // 排除同一个单词内多次匹配的情况
              wordPos.push(wordPosMap[prop]);
            }
          }

          // 重新生成段落 html
          para.html = page.items[paraIndex].division.group.map((word, index) => {
            const result = wordPos.filter(i => (
              index >= i[0]
              && index <= i[1]
              && word === para.group[index]
            ));
            const offset = page.items[paraIndex].division.offsets[index];
            if (result.length > 0) {
              return `<span class="word" data-length="${word.length}" data-offset="${offset}" style="color: red">${word}</span>`;
            } else {
              return `<span class="word" data-length="${word.length}" data-offset="${offset}">${word}</span>`;
            }
          }).join('');
        }
      });
    }

    const contentHtml = page.items.map((item, index) => {
      return this._createHtmlOutput(
        Object.assign(
          {},
          item,
          { division: pureDivision[index] }
        )
      );
    }).join('');

    const pageHtml = this._wrapPageContentHtml(
      Object.assign(
        {},
        page,
        { html: contentHtml }
      )
    );
    return pageHtml;
  },
}


export default Layout;