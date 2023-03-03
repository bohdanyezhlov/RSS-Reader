/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import 'bootstrap';
import i18n from 'i18next';
import axios from 'axios';
import { uniqueId, concat } from 'lodash';
import resources from './locales/index';
import render from './render';
import parser from './parser/index';

const watchVisitedPost = (state, { elements }) => {
  const postButtons = document.querySelectorAll('button[data-bs-toggle=modal]');
  const postLinks = document.querySelectorAll('li > a');
  const postElements = concat(...postButtons, ...postLinks);
  postElements.forEach((postEl) => {
    postEl.addEventListener('click', () => {
      const visitedId = postEl.getAttribute('data-id');
      render(state, { elements }).uiState.posts.visitedId.push(visitedId);
    });
  });
};

const fetchNewData = (state, { elements }, i18nInstance, getUniqueId) => {
  const delay = 5000;
  const promises = state.rssForm.feedUrls.map((url) => {
    const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

    return axios.get(link)
      .then((response) => {
        const xmlDoc = parser(response.data.contents);

        if (xmlDoc) {
          const { posts } = xmlDoc;
          const newPosts = posts.filter((obj2) => {
            const current = !state.posts.some((obj1) => {
              const isEqual = obj1.itemTitle === obj2.itemTitle;
              return isEqual;
            });
            return current;
          });

          if (newPosts.length) {
            // eslint-disable-next-line no-return-assign
            newPosts.forEach((post) => post.itemId = getUniqueId());
            render(state, { elements }, i18nInstance).posts.unshift(...newPosts);
            watchVisitedPost(state, { elements });
          }
        }
      })
      .catch((e) => (e.message)); // ?
  });

  Promise.all(promises).then(() => {
    setTimeout(() => fetchNewData(state, { elements }, i18nInstance, getUniqueId), delay);
  });
};

export default () => {
  const defaultLanguage = 'ru';

  const state = {
    lng: defaultLanguage,
    rssForm: {
      feedUrls: [],
      valid: null,
      state: null,
      error: null,
    },
    feeds: [],
    posts: [],
    uiState: {
      posts: {
        visitedId: [],
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
    button: document.querySelector('button[type="submit"]'),
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

    const baseUrlSchema = yup.string().url().required();
    const uniqUrlsSchema = baseUrlSchema.notOneOf(state.rssForm.feedUrls);
    const getUniqueId = () => uniqueId();

    uniqUrlsSchema.validate(data.url)
      .then(() => {
        render(state, { elements }).rssForm.state = 'sending';

        const link = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(data.url)}`;
        axios.get(link)
          .then((response) => {
            const xmlDoc = parser(response.data.contents);

            if (xmlDoc) { // Valid RSS feed
              const { feed } = xmlDoc;
              feed.id = getUniqueId();
              const { posts } = xmlDoc;
              // eslint-disable-next-line no-return-assign
              posts.forEach((post) => post.itemId = getUniqueId());

              state.feeds.unshift(feed);
              state.posts.unshift(...posts);
              state.rssForm.feedUrls.push(data.url);
              state.rssForm.error = '';
              render(state, { elements }, i18nInstance).rssForm.valid = true;
              state.rssForm.valid = null;
              render(state, { elements }).rssForm.state = 'finished';
              watchVisitedPost(state, { elements });
              fetchNewData(state, { elements }, i18nInstance, getUniqueId);
            } else { // Invalid RSS feed
              state.rssForm.error = 'noValidRss';
              render(state, { elements }, i18nInstance).rssForm.valid = false;
              state.rssForm.valid = null;
              render(state, { elements }).rssForm.state = 'finished';
            }
          })
          .catch((error) => {
            console.log(error.message, 'Ошибка сети');
            state.rssForm.error = 'networkError';
            render(state, { elements }, i18nInstance).rssForm.valid = false;
            state.rssForm.valid = null;
            render(state, { elements }).rssForm.state = 'finished';
          });
      })
      .catch((err) => {
        const [currentError] = err.message.split(':');
        let errorMessage = '';

        switch (currentError) {
          case 'this must be a valid URL':
            errorMessage = 'invalidUrl';
            break;
          case 'this must not be one of the following values':
            errorMessage = 'alreadyExist';
            break;
          default:
            break;
        }

        console.log(err.message, errorMessage);
        state.rssForm.error = errorMessage;
        render(state, { elements }, i18nInstance).rssForm.valid = false;
        state.rssForm.valid = null;
      });
  });
};
