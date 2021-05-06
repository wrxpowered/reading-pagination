function decode(value, options) {
  if (options.decode) {
    return decodeURIComponent(value);
  }
  return value;
}


function splitOnFirst(string, separator) {
  if (!(typeof string === 'string' && typeof separator === 'string')) {
    throw new TypeError('Expected the arguments to be of type `string`');
  }

  if (separator === '') {
    return [string];
  }

  const separatorIndex = string.indexOf(separator);

  if (separatorIndex === -1) {
    return [string];
  }

  return [
    string.slice(0, separatorIndex),
    string.slice(separatorIndex + separator.length)
  ];
};


function parserForArrayFormat(key, value, accumulator) {
  if (accumulator[key] === undefined) {
    accumulator[key] = value;
    return;
  }
  accumulator[key] = [].concat(accumulator[key], value);
}


/**
 * 解析查询字符串
 * 输入：'?key=value'
 * 输出：{key: value}
 * @param {String} input eg.`?key=value`
 * @param {Object} options  {decode: Boolean} 是否解码URI
 */
function parse(input, options) {
  options = Object.assign({ decode: true }, options);

  // Create an object with no prototype
  const ret = Object.create(null);

  if (typeof input !== 'string') {
    return ret;
  }

  input = input.trim().replace(/^[?#&]/, '');

  if (!input) {
    return ret;
  }

  for (const param of input.split('&')) {
    let [key, value] = splitOnFirst(param.replace(/\+/g, ' '), '=');

    // Missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    value = value === undefined ? null : decode(value, options);

    parserForArrayFormat(decode(key, options), value, ret);
  }

  return Object.keys(ret).reduce((result, key) => {
    const value = ret[key];

    result[key] = value;

    return result;
  }, Object.create(null));
}


/**
 * 解析完整的URL
 * 输入：'www.cxstar.com?key=value'
 * 输出：{url: String, query: {key: value}}
 * @param {*} input 
 * @param {*} options {decode: Boolean} 是否解码URI(默认true)
 */
function parseUrl(input, options) {
  const extract = (input) => {
    const queryStart = input.indexOf('?');
    if (queryStart === -1) {
      return '';
    }

    return input.slice(queryStart + 1);
  }

  const hashStart = input.indexOf('#');
  if (hashStart !== -1) {
    input = input.slice(0, hashStart);
  }

  return {
    url: input.split('?')[0] || '',
    query: parse(extract(input), options)
  };
};


export {
  parseUrl,
}