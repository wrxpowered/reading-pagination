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
 * 预设 5 级标题梯度
 */
const HEADLINE_LEVELS = ['1', '2', '3', '4', '5'];


/**
 * 预设 5 种插图宽度百分比
 */
const ILLUS_RATIO = {
  'xs': 0.8,
  's':  0.82,
  'm':  0.85,
  'l':  0.9,
  'xl': 0.95
}


/**
 * 标题字体级别梯度
 */
const HEADLINE_LEVEL_MAP = {
  '1':  0,
  '2': -1,
  '3': -2,
  '4': -4,
  '5': -6,
}


/**
 * 标题字体大小
 */
const HEADLINE_FONT_SIZE_MAP = {
  'xs': 24,
  's':  26,
  'm':  28,
  'l':  30,
  'xl': 32,
}


/**
 * 段落字体大小
 */
const PARAGRAPH_FONT_SIZE_MAP = {
  'xs': 16,
  's':  18,
  'm':  20,
  'l':  22,
  'xl': 24,
}


/**
 * 文本分割
 */
const WORD_SPLIT_REG_EXP = /(\w+)|([\s]+)|(\S)/g;


/**
 * 非空白符
 */
const NON_BLANK_CHAR_REG_EXP = /\S/g;


/**
 * 注释标识
 * $cxre${注释内容}$mark$
 */
const ANNOTATION_REG_EXP = /(\$cxre\$)(.*?)(\$mark\$)/g;


/**
 * 图标标识
 * $cxi${图标的url?width=图标宽度&height=图标高度}$mg$
 */
const ICON_REG_EXP = /(\$cxi\$)(.*?)(\$mg\$)/g;


/**
 * 上标标识
 * $cxs${上标内容}$up$
 */
const SUPERSCRIPT_REG_EXP = /(\$cxs\$)(.*?)(\$up\$)/g;


/**
 * 非文本 HTML 匹配（注释、图标、上标）
 */
const GRAPH_HTML_REG_EXP = /(<\s*span[^>]*>.*?<\s*\/\s*span>)/g;


/**
 *  unicode 标点符号
 */
const UNICODE_PUNCTUATION_REG_EXP = RegExp("[\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\u2029\u2028 \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D4F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFDFD\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD\\+<->\\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC\\^`\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uAB6A\uAB6B\uFBB2-\uFBC1\uFF3E\uFF40\uFFE3\\$\xA2-\xA5\u058F\u060B\u07FE\u07FF\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BF\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6\\$\\+<->\\^`\\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD\\(\\[\\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62!-#%-\'\\*,\\.\\/:;\\?@\\\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u2E43-\u2E4F\u2E52\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21\\)\\]\\}\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63\\-\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F!-#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]", 'g');


// 注释图标
const ANNOTATION_ICON = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEGElEQVRYhbWXX0xbdRTHP2UUWkZbWqGwshUYuGbi2BxhW4bJNCzG4J9nTfRJFp992Xw0Pqkv+uCDD+7BZIm+LRrFP3FZdKJmRtxQJPzp2Mr+0MEYbfk3Wqc5t792t7f3thcH3+Tm3vv7nd855557/jq+/vAkNlELPAc8DRwA2gCfOpoApoFLwHngK2DJDttKGzQdwCngZWC7BU1QXYeB14Fl4FPgXWCqFPOKEnsu4B1gFBgoIdwM29WZUaWEa6MKtAO/qC+v2oBgI+TsScWrw64CB4Eh+c++xpaS3GW/rfs4TldZ44jP/KR4l1RAtPwGaJQXb3Anx0+8zZ6jz5sKScSvkVlf5dirpzSaMmhUvAssse2V/t7csxv4DtidW0jeniGdXidy5Bn8od3cGLtYJEJoPA3NhDt7qHC6uDMzUUoN+YqngE+AjNECbwH7jSdm/hxiLjaJv2mXJde/fzhLZv0e4c5D5awg6FKyNOQsIE53Rt7NTszHxolfGeX+PxkCoQ5WEvMF+/czaf51bMPhcHBrYrhgT3wk2PaY0TKHVJgu5PLAm4DTSuX02jKJteWsw1W7COxsN6VL3Zkt8gWxSmVVNW5PHZe/PZNbdiqZA6KARyWZPHbt6yW05wnu3rrK9PB5TQFBINTK2IXPqfHWFwmP9PZr9/GhwYL1hevR7EfcWzEeeQl4QxToNyYZ+e/J29fpefE1GloiXDz7EY+EIyzcvMrK4px2GdHe06etzMfGrAxphMjsFyfsM9uVEIsO/4gnEMQXDNMcOUg8etkuc7voq1ReaYrp378nNXeDleQ8rlqf6Zc/JLoqVARYQkzaeuAYsb9+3WzhgnZRwFuOKvRoF7OTlzbMXbJn9wsDpVK1t2w5loi4OxvLR4K8uz3+Ijp3bbY10Iehf0erlsAkVf/2xWnNr4wQBZJAcVwphB8/ws2JB84nCcUsDCVa0IWd8dmYvBSSokDUSoH68F4tCvTev4lhKIiKD4wYV+WfifCW/b2sLSW3wvtzGBEFzpntuH0B/E1hVpcSWyVccE4UGFQ9XB7icNkqOJF3ri2A5OZBUSAFfGbGfzW1iKvWS01dw1YoINUwlesHpPlMW1Gaeb1diD9JFTUgrZrVfFsurfP7qoHMo7LqQTMrjKQmWEFKLipy9Gje282Ojn1465v05fgDYFKvAKpLeVZfG6T2C6QWiF9Y9QGCuWvj2t1II7/xyh8Xspasa5CIGtF3RMbJSBrGnyWv5A44q2tMM9j/hMTzUf2wYuyKp5QV4qiks4nC44p3waRkNhdIU/ekWYJ6CIwonsNGFlaT0ZSa894rFR02kFY8DlvNiKVmwzU1mnUCH6vEYRerwGl1VngIL1PYmY4lXE5IAwlIrdWP53WKZtEwnn9pazwH/gMjmUVf4wqM2AAAAABJRU5ErkJggg==`



export {
  VIEWPORT_DOM,
  FORMAT,
  SIZE_LEVELS,
  HEADLINE_LEVELS,
  ILLUS_RATIO,
  HEADLINE_LEVEL_MAP,
  HEADLINE_FONT_SIZE_MAP,
  PARAGRAPH_FONT_SIZE_MAP,
  WORD_SPLIT_REG_EXP,
  NON_BLANK_CHAR_REG_EXP,
  ANNOTATION_REG_EXP,
  ICON_REG_EXP,
  SUPERSCRIPT_REG_EXP,
  GRAPH_HTML_REG_EXP,
  UNICODE_PUNCTUATION_REG_EXP,
  ANNOTATION_ICON,
}