# reading-pagination

## Usage
```js
// acceptable source data format just like this
var data = [
  {
    id: '1',
    type: 'headline',
    data: {
      level: '1', // one of ['1', '2', '3']
      text: 'Chapter 1'
    }
  },
  {
    id: '2',
    type: 'paragraph',
    data: {
      text: 'This is a normal paragraph.'
    }
  },
  {
    id: '3',
    type: 'illus',
    data: {
      img: {
        src: 'https://www.something.com/test.png',
        origWidth: 400,
        origHeight: 200
      }
    }
  },
  {
    id: '4',
    type: 'pagebreak'
  }
]

// craete instance
const layout = new Layout();

// `render` method make the data divided by page
const htmlPageGroup = layout.render(data);

/**
 * rendered pageInfo like this:
 * {
 *    index: 0,
 *    boundaryFrom: { id: '1', type: 'headline' }
 *    bouddaryTo: { id: '3', type: 'illus' }
 *    html: '......',
 *    height: 396,
 *    items: [...],
 * }
 */
htmlPageGroup.forEach(pageInfo => document.body.insertAdjacentHTML('beforeend', pageInfo.html));
```

## API
* `render(data)`
create paginated content from source data.
<br>

* `renderWithoutPagination(data)`
compose data without pagination.
<br>

* `updateSize(newSize)`
update layout size. accept: `['xs', 's', 'm', 'l', 'xl']`
<br>

* `findItem(itemId, charOffset)`
find a paragraph in which page.
<br>

* `extractFromPage(pageIndex)`
extract detailed textual content from a page.
<br>

* `highlightKeywordFromPage(pageIndex, keyword)`
highlight keyword in rendered html.