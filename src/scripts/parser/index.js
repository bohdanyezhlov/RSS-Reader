export default (data) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'text/xml');
  const errorNode = xmlDoc.querySelector('parsererror');

  if (errorNode) {
    return false;
  }

  const feed = {
    channelTitle: xmlDoc.querySelector('title').textContent,
    channelDescription: xmlDoc.querySelector('description').textContent,
  };

  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;

    return {
      itemTitle,
      itemDescription,
      itemLink,
    };
  });

  return {
    feed,
    posts,
  };
};
