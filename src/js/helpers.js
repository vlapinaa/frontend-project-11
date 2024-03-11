export const transformXmlItem = (feed, item) => ({
  feed,
  title: item.querySelector('title')?.textContent || 'Title',
  description: item.querySelector('description')?.textContent ?? 'Description',
  link: item.querySelector('link')?.textContent || 'Link',
  publicationDate: item.querySelector('pubDate')?.textContent || 'Publication date',
});
