import { ParsingError } from '../types/interfaces';

export default (data: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, 'text/xml');
  const errorNode = xmlDoc.querySelector('parsererror');

  if (errorNode) {
    const error: ParsingError = new Error(
      errorNode.textContent ?? ''
    ) as ParsingError;
    error.isParsingError = true;
    throw error;
  }

  const feed = {
    title: xmlDoc.querySelector('title')?.textContent ?? '',
    description: xmlDoc.querySelector('description')?.textContent ?? '',
  };

  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const title = item.querySelector('title')?.textContent ?? '';
    const description = item.querySelector('description')?.textContent ?? '';
    const link = item.querySelector('link')?.textContent ?? '';

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
