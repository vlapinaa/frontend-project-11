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
    pubDate: item.querySelector('pubDate')?.textContent || 'Publication date',
  }));

  return {
    title: xml.querySelector('title')?.textContent || 'TitleFeed',
    description: xml.querySelector('description')?.textContent || 'DescriptionFeed',
    items: transformXmlItem,
  };
};

export default parseRSS;
