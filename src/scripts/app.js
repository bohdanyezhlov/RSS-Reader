/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import 'bootstrap';
import i18n from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import resources from './locales/index';
import render from './render';
import parser from './parser/index';

const getFeed = (xmlDoc, getUniqueId) => {
  const feed = {
    id: getUniqueId(),
    channelTitle: xmlDoc.querySelector('title').textContent,
    channelDescription: xmlDoc.querySelector('description').textContent,
  };

  return feed;
};

const getPosts = (xmlDoc, getUniqueId) => {
  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const itemId = getUniqueId();
    const itemTitle = item.querySelector('title').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;

    return {
      itemId,
      itemTitle,
      itemDescription,
      itemLink,
    };
  });

  return posts;
};

const fetchNewData = (state, { elements }, i18nInstance, getUniqueId) => {
  const delay = 5000;
  const promises = state.rssForm.urls.map((url) => {
    const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

    return axios.get(link)
      .then((response) => {
        const xmlDoc = parser(response.data.contents);
        const errorNode = xmlDoc.querySelector('parsererror');

        if (!errorNode) {
          const posts = getPosts(xmlDoc, getUniqueId);
          const newPosts = posts.filter((obj2) => {
            const current = !state.posts.some((obj1) => {
              const isEqual = obj1.itemTitle === obj2.itemTitle;
              return isEqual;
            });
            return current;
          });

          if (newPosts.length) {
            render(state, { elements }, i18nInstance).posts.unshift(...newPosts);
          }
        }
      });
  });

  Promise.all(promises).then(() => {
    setTimeout(() => fetchNewData(state, { elements }, i18nInstance, getUniqueId), delay);
  });
};

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

export default () => {
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
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
    // eslint-disable-next-line consistent-return
  }, (err, t) => {
    if (err) {
      return console.log('something went wrong loading', err);
    }
    t('key');
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
      console.log('RSS уже существует');
      state.rssForm.error = 'alreadyExist';
      render(state, { elements }, i18nInstance).rssForm.valid = false;
      state.rssForm.valid = null; // reset
    } else {
      schema.validate(data)
        .then(() => {
          // console.log('Valid URL');
          const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(data.url)}`;
          axios.get(link) // try catch?
            .then((response) => {
              const xmlDoc = parser(response.data.contents);
              const errorNode = xmlDoc.querySelector('parsererror');
              const getUniqueId = () => uniqueId();

              if (!errorNode) {
                // console.log('Valid RSS feed');

                // getFeed
                const feed = getFeed(xmlDoc, getUniqueId);

                // getPosts
                const posts = getPosts(xmlDoc, getUniqueId);

                state.feeds.unshift(feed);
                state.posts.unshift(...posts);
                state.rssForm.urls.push(data.url);
                state.rssForm.error = '';
                render(state, { elements }, i18nInstance).rssForm.valid = true;
                state.rssForm.valid = null;

                fetchNewData(state, { elements }, i18nInstance, getUniqueId);
                //
              } else {
                console.log('Invalid RSS feed');
                state.rssForm.error = 'noValidRss';
                render(state, { elements }, i18nInstance).rssForm.valid = false;
                state.rssForm.valid = null;
                // throw new error?
              }
            })
            .catch((error) => {
              console.log(error, 'Ошибка сети');
              state.rssForm.error = 'networkError';
              render(state, { elements }, i18nInstance).rssForm.valid = false;
              state.rssForm.state = null;
            });
        })
        .catch((error) => {
          console.log(error, 'Ссылка должна быть валидным URL');
          state.rssForm.error = 'invalidUrl';
          render(state, { elements }, i18nInstance).rssForm.valid = false;
          state.rssForm.valid = null;
        });
    }
  });
};
