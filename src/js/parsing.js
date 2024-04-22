const parseRSS = (data) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(data.contents, 'text/xml');
  const errorNode = xml.querySelector('parsererror');
  if (errorNode) {
    const parsingError = new Error('incorrect RSS');
    parsingError.name = 'incorrectRSS';
    throw parsingError;
  }
  const items = xml.querySelectorAll('item');
  const transformXmlItem = Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent || 'Title',
    description: item.querySelector('description')?.textContent ?? 'Description',
    link: item.querySelector('link')?.textContent || 'Link',
    publicationDate: item.querySelector('pubDate')?.textContent || 'Publication date',
  }));

  const feed = {
    title: xml.querySelector('title').textContent,
    description: xml.querySelector('description').textContent,
  };

  return { transformXmlItem, feed };
};

export default parseRSS;
