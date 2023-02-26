/* eslint-disable no-unused-vars */
import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import resources from './locales/index';
import render from './render';
import parser from './parser/index';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

export default async () => {
  const defaultLanguage = 'ru';

  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({ // => promise
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    urlForm: {
      urls: [],
      valid: null,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('button'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUrl = (new FormData(e.target)).get('url');
    const data = {
      url: newUrl,
    };

    if (state.urlForm.urls.includes(data.url)) { // => yup notoneof
      state.urlForm.valid = false;
      render(state, { elements }, i18nInstance).urlForm.error = 'alreadyExist';
      state.urlForm.error = null;
      // console.log('RSS уже существует', state.urlForm);
    } else {
      schema.validate(data)
        .then((valid) => {
          // console.log('Valid URL');
          const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(data.url)}`;
          axios.get(link)
            .then((response) => {
              const xmlDoc = parser(response.data.contents);
              const rssItems = xmlDoc.getElementsByTagName('channel');
              const getUniqueId = () => uniqueId();

              // Check if the RSS feed contains items (which indicates that it's a valid RSS feed)
              if (rssItems.length > 0) {
                // renderFeeds
                const feed = {
                  id: getUniqueId(), // 0 - feed, 1 - post ?
                  channelTitle: xmlDoc.querySelector('title').innerHTML,
                  channelDescription: xmlDoc.querySelector('description').innerHTML,
                };
                state.feeds.unshift(feed);
                // renderPosts
                const items = xmlDoc.querySelectorAll('item');
                const postsItems = Array.from(items).map((item) => {
                  const itemTitle = item.querySelector('title').innerHTML;
                  const itemDescription = item.querySelector('description').innerHTML;
                  const itemLink = item.querySelector('link').innerHTML;
                  const itemId = getUniqueId(); // 0 - feed, 1 - post ?
                  // const feedId = state.feeds           sync feed => post ?
                  return {
                    itemId,
                    itemTitle,
                    itemDescription,
                    itemLink,
                  };
                });
                state.posts.unshift(...postsItems);
                state.urlForm.urls.push(data.url);
                state.urlForm.valid = true;
                render(state, { elements }, i18nInstance).urlForm.error = '';
                state.urlForm.error = null;
                // console.log('Valid RSS feed');
              } else {
                state.urlForm.valid = false;
                render(state, { elements }, i18nInstance).urlForm.error = 'noValidRss';
                state.urlForm.error = null;
                // console.log('Invalid RSS feed');
              }
            })
            .catch((error) => {
              state.urlForm.valid = false;
              render(state, { elements }, i18nInstance).urlForm.error = 'networkError';
              state.urlForm.error = null;
              // console.log(error, Ошибка сети);
            });
        })
        .catch((error) => {
          state.urlForm.valid = false;
          render(state, { elements }, i18nInstance).urlForm.error = 'invalidUrl';
          state.urlForm.error = null;
          // console.log('Ссылка должна быть валидным URL', state.urlForm, error);
        });
    }
  });
};
