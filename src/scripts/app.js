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
const requestTimeout = 15000;
const delay = 5000;

const fetchNewData = (watchedState) => {
  const urls = watchedState.feeds.map(({ url }) => url);
  const promises = urls.map((url) => {
    const link = getProxyLink(url);

    return axios.get(link, { timeout: requestTimeout })
      .then((response) => {
        const xmlDoc = parser(response.data.contents);

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
        }
      })
      .catch(() => {
        // console.log(error.message); // FIXME: what to do with failed requests?
      });
  });

  Promise.all(promises).finally(() => {
    setTimeout(() => fetchNewData(watchedState), delay);
  });
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('.rss-form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modalHeader: document.querySelector('.modal-title'),
    modalText: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.full-article'),
  };

  const defaultLanguage = 'ru';

  const initialState = {
    lng: defaultLanguage,
    form: {
      error: null,
    },
    loadingProcess: {
      status: null,
      error: null,
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

        uniqUrlsSchema.validate(data.url)
          .then(() => {
            const link = getProxyLink(data.url);
            watchedState.loadingProcess.status = 'receiving';
            watchedState.loadingProcess.error = null;
            watchedState.form.error = null;
            axios.get(link, { timeout: requestTimeout })
              .then((response) => {
                const xmlDoc = parser(response.data.contents);
                const { feed, posts } = xmlDoc;

                feed.id = uniqueId(); // FIXME: generate ID even if request failed
                feed.url = data.url;

                const postsWithId = posts.map((post) => {
                  const postWithId = post;
                  postWithId.itemId = uniqueId();
                  return postWithId;
                });

                watchedState.feeds.unshift(feed);
                watchedState.posts.unshift(...postsWithId);
                watchedState.loadingProcess.status = 'received';

                watchVisitedPost(watchedState);
                fetchNewData(watchedState);
              })
              .catch((error) => {
                const errorType = axios.isAxiosError(error) ? 'networkError' : 'invalidRss';
                watchedState.loadingProcess.status = 'failed';
                watchedState.loadingProcess.error = errorType;
                console.log(i18nInstance.t(errorType));
              });
          })
          .catch((error) => {
            console.log(error.message);
            watchedState.form.error = error.message;
          });
      });
    })
    .catch((error) => console.log(error.message));
};
