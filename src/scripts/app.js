/* eslint-disable no-unused-vars */
import * as yup from 'yup';
import 'bootstrap';
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

  const state = {
    lng: defaultLanguage,
    rssForm: {
      urls: [],
      valid: null,
      error: null,
    },
    feeds: [],
    posts: [],
    uiState: {
      posts: {
        visited: [],
      },
    },
  };

  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({ // => promise ?
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('button'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modalHeader: document.querySelector('.modal-title'),
    modalText: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.full-article'),
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUrl = (new FormData(e.target)).get('url');
    const data = {
      url: newUrl,
    };

    if (state.rssForm.urls.includes(data.url)) { // => yup notoneof
      // console.log('RSS уже существует');
      state.rssForm.error = 'alreadyExist';
      render(state, { elements }, i18nInstance).rssForm.valid = false;
      state.rssForm.valid = null; // reset
    } else {
      schema.validate(data)
        .then((valid) => {
          // console.log('Valid URL');
          const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(data.url)}`;
          axios.get(link) // try catch?
            .then((response) => {
              const xmlDoc = parser(response.data.contents);
              const rssItems = xmlDoc.getElementsByTagName('item');
              const getUniqueId = () => uniqueId();

              // Check if the RSS feed contains items (which indicates that it's a valid RSS feed)
              if (rssItems.length > 0) {
                // console.log('Valid RSS feed');

                // getFeed
                const feed = {
                  id: getUniqueId(),
                  channelTitle: xmlDoc.querySelector('title').innerHTML,
                  channelDescription: xmlDoc.querySelector('description').innerHTML,
                };

                // getPosts
                const items = xmlDoc.querySelectorAll('item');
                const postsItems = Array.from(items).map((item) => {
                  const itemTitle = item.querySelector('title').innerHTML;
                  const itemDescription = item.querySelector('description').innerHTML;
                  const itemLink = item.querySelector('link').innerHTML;
                  const itemId = getUniqueId();
                  // const feedId = connect feed => posts ?
                  return {
                    itemId,
                    itemTitle,
                    itemDescription,
                    itemLink,
                  };
                });

                state.feeds.unshift(feed);
                state.posts.unshift(...postsItems);
                state.rssForm.urls.push(data.url);
                state.rssForm.error = '';
                render(state, { elements }, i18nInstance).rssForm.valid = true;
                state.rssForm.valid = null;
                // getUpdates ? state.rssForm.url // add setTimeout
                // console.log(state.rssForm.urls);
              } else {
                // console.log('Invalid RSS feed');
                state.rssForm.error = 'noValidRss';
                render(state, { elements }, i18nInstance).rssForm.valid = false;
                state.rssForm.valid = null;
              }
            })
            .catch((error) => {
              // console.log(error, Ошибка сети);
              state.rssForm.error = 'networkError';
              render(state, { elements }, i18nInstance).rssForm.valid = false;
              state.rssForm.state = null;
            });
        })
        .catch((error) => {
          // console.log('Ссылка должна быть валидным URL', state.rssForm, error);
          state.rssForm.error = 'invalidUrl';
          render(state, { elements }, i18nInstance).rssForm.valid = false;
          state.rssForm.valid = null;
        });
    }
  });
};
