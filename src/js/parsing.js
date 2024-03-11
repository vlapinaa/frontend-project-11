import axios from 'axios';

export const parseRSS = (url) => axios.get('https://allorigins.hexlet.app/get', {
  params: {
    url,
  },
})
  .then(({ data }) => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(data.contents, 'text/xml');
    if (xml.activeElement.nodeName !== 'rss') {
      const parsingError = new Error('incorrect RSS');
      parsingError.name = 'incorrectRSS';
      throw parsingError;
    }

    return xml;
  });
