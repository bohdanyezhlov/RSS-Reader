import * as yup from 'yup';
import 'bootstrap';
import i18n from 'i18next';
import axios from 'axios';
import { uniqueId, includes } from 'lodash';
import resources from './locales/index';
import watch from './render';
import parser from './parser/index';

const watchVisitedPost = (watchedState) => {
  document.addEventListener('click', (e) => {
    const visitedId = e.target.getAttribute('data-id');

    if (visitedId) {
      const isInclude = includes(watchedState.ui.posts.visitedIds, visitedId);

      if (!isInclude) {
        watchedState.ui.posts.visitedIds.push(visitedId);
      }
    }
  });
};

const getProxyLink = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
const delay = 5000;

const fetchNewData = (watchedState) => {
  const urls = watchedState.feeds.map(({ url }) => url);
  const promises = urls.map((url) => {
    const link = getProxyLink(url);

    return axios.get(link)
      .then((response) => {
        watchedState.update.processState = 'receiving'; // FIXME: before or inside promise?

        const xmlDoc = parser(response.data.contents);

        // if (xmlDoc) { // FIXME:
        const { posts } = xmlDoc;
        const newPosts = posts
          .filter((obj2) => !watchedState.posts
            .some((obj1) => obj1.itemTitle === obj2.itemTitle));

        if (newPosts.length) {
          const postsWithId = newPosts.map((post) => {
            post.itemId = uniqueId();
            return post;
          });

          watchedState.posts.unshift(...postsWithId);
          watchedState.update.processState = 'received';
        }
        // }
      })
      .catch((e) => (
        e.message // FIXME: what to do with failed requests?
      ));
  });

  Promise.all(promises).then(() => {
    setTimeout(() => fetchNewData(watchedState), delay);
  });
};

export default () => {
  const defaultLanguage = 'ru';

  const initialState = {
    lng: defaultLanguage,
    form: {
      processState: 'filling',
      error: null,
    },
    update: {
      processState: null,
    },
    feeds: [],
    posts: [],
    ui: {
      posts: {
        visitedIds: [],
      },
    },
  };

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      const elements = { // FIXME: before initialState?
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

      const watchedState = watch(initialState, { elements }, i18nInstance);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUrl = (new FormData(e.target)).get('url');
        const data = {
          url: newUrl,
        };

        yup.setLocale({
          string: {
            url: i18nInstance.t('invalidUrl'),
          },
          mixed: {
            notOneOf: i18nInstance.t('alreadyExist'),
          },
        });
        const baseUrlSchema = yup.string().url().required();
        const urls = watchedState.feeds.map(({ url }) => url);
        const uniqUrlsSchema = baseUrlSchema.notOneOf(urls);

        watchedState.form.processState = 'receiving'; // FIXME: before or inside promise
        watchedState.form.error = null;

        uniqUrlsSchema.validate(data.url)
          .then(() => {
            const link = getProxyLink(data.url);
            axios.get(link)
              .then((response) => {
                const xmlDoc = parser(response.data.contents);

                if (xmlDoc) { // FIXME:
                  const { feed, posts } = xmlDoc;
                  feed.id = uniqueId();
                  feed.url = data.url;
                  const postsWithId = posts.map((post) => {
                    const postWithId = post;
                    postWithId.itemId = uniqueId();
                    return postWithId;
                  });

                  watchedState.feeds.unshift(feed);
                  watchedState.posts.unshift(...postsWithId);
                  watchedState.form.processState = 'received';

                  watchVisitedPost(watchedState);
                  fetchNewData(watchedState);
                } else {
                  watchedState.form.processState = 'error';
                  watchedState.form.error = 'noValidRss';
                }
              })
              .catch((error) => {
                console.log(error.message, 'Ошибка сети или invalidRSS'); // FIXME: networkError || undefined
                watchedState.form.processState = 'error';
                watchedState.form.error = 'networkError';
              });
          })
          .catch((error) => {
            console.log(error, error.message);
            watchedState.form.processState = 'error';
            watchedState.form.error = error.message;
          });
      });
    })
    .catch((error) => console.log(error.message));
};
