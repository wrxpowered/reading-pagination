/**
 * DOM 标识
 */
const VIEWPORT_DOM = {
  ID: 'layout-viewport',
  CLASSNAME: 'layout layout-viewport'
}


/**
 * 预设 4 种段落格式
 */
const FORMAT = {
  PARAGRAPH: 'paragraph', // 文本
  HEADLINE: 'headline', // 标题
  ILLUS: 'illus', // 插图
  PAGEBREAK: 'pagebreak', // 分页符
}


/**
 * 预设 5 种排版尺寸
 */
const SIZE_LEVELS = ['xs', 's', 'm', 'l', 'xl'];


/**
 * 预设 3 级标题梯度
 */
const HEADLINE_LEVELS = ['1', '2', '3'];


/**
 * 预设 5 种插图宽度百分比
 */
const ILLUS_RATIO = {
  'xs': 0.8,
  's': 0.82,
  'm': 0.85,
  'l': 0.9,
  'xl': 0.95
}


/**
 * 文本分割
 */
const WORD_SPLIT_REG_EXP = /(\w+)|([\s]+)|(\S)/g;


/**
 * 非空白符
 */
const NON_BLANK_CHAR_REG_EXP = /\S/;


export {
  VIEWPORT_DOM,
  FORMAT,
  SIZE_LEVELS,
  HEADLINE_LEVELS,
  ILLUS_RATIO,
  WORD_SPLIT_REG_EXP,
  NON_BLANK_CHAR_REG_EXP,
}