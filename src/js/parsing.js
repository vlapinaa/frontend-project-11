import { transformXmlItem } from './helpers';

export const parseRSS = (data, url) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(data.contents, 'text/xml');
  if (xml.activeElement.nodeName !== 'rss') {
    const parsingError = new Error('incorrect RSS');
    parsingError.name = 'incorrectRSS';
    throw parsingError;
  }
  const items = xml.querySelectorAll('item');

  return {
    title: xml.querySelector('title').textContent,
    description: xml.querySelector('description').textContent,
    posts: Array.from(items).map((item) => transformXmlItem(url, item)),
  };
};
