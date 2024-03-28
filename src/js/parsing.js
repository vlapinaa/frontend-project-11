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

  return {
    title: xml.querySelector('title').textContent,
    description: xml.querySelector('description').textContent,
    posts: Array.from(items),
    newPosts: [],
  };
};

export default parseRSS;
