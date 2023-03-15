export default (data) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'text/xml');
  const errorNode = xmlDoc.querySelector('parsererror');

  if (errorNode) {
    throw new Error('parsererror');
  }

  const feed = {
    title: xmlDoc.querySelector('title').textContent,
    description: xmlDoc.querySelector('description').textContent,
  };

  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return {
      title,
      description,
      link,
    };
  });

  return {
    feed,
    posts,
  };
};
