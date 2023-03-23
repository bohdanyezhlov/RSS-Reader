import * as yup from 'yup';
import 'bootstrap';
import i18n from 'i18next';
import axios, { AxiosError } from 'axios';
import { uniqueId, differenceWith } from 'lodash';
import resources from './locales/index';
import yupLocale from './locales/yupLocale';
import watch from './render';
import parser from './parser/index';
import { Data, InitialState, ParsingError } from './types/interfaces';

const validate = (url: string, urls: string[]) => {
  const baseUrlSchema = yup.string().url().required();
  const uniqUrlsSchema = baseUrlSchema.notOneOf(urls);

  return uniqUrlsSchema.validate(url);
};

const watchVisitedPost = (watchedState: InitialState, { elements }: any) => {
  elements.posts.addEventListener('click', (e: MouseEvent) => {
    const visitedId = (e.target as HTMLElement)?.getAttribute('data-id');

    if (visitedId) {
      watchedState.ui.posts.visitedIds.add(visitedId);
    }
  });
};

const getErrorType = (error: ParsingError | AxiosError) => {
  if ('isParsingError' in error && error.isParsingError) {
    return 'invalidRss';
  }
  return axios.isAxiosError(error) ? 'networkError' : 'undefinedError';
};

const getProxyLink = (url: string) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const requestTimeout = 15_000;
const delay = 5_000;

const fetchNewData = (watchedState: InitialState) => {
  const urls = watchedState.feeds.map(({ url }) => url);
  const promises = urls.map((url) => {
    const link = getProxyLink(url);

    return axios
      .get(link, { timeout: requestTimeout })
      .then((response) => {
        const xmlDoc = parser(response.data.contents);

        const { posts } = xmlDoc;
        const newPosts = differenceWith(
          posts,
          watchedState.posts,
          (obj1, obj2) => obj1.title === obj2.title
        ).map((post) => ({
          ...post,
          id: uniqueId(),
        }));

        watchedState.posts.unshift(...newPosts);
      })
      .catch((error) => console.log(error.message));
  });

  Promise.all(promises).finally(() => {
    setTimeout(() => fetchNewData(watchedState), delay);
  });
};

export default () => {
  // type Elements = typeof elements; // TODO: Elements
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
  } as const;

  const initialState: InitialState = {
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
        visitedIds: new Set(),
      },
    },
  };

  const defaultLanguage = 'ru';

  const i18nInstance = i18n.createInstance();
  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale(yupLocale);
      const watchedState = watch(initialState, { elements }, i18nInstance);

      elements.form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUrl = new FormData(e.target as HTMLFormElement).get(
          'url'
        ) as string; // FIXME: remove as HTMLFormElement
        const data: Data = {
          url: newUrl,
        };
        const urls = watchedState.feeds.map(({ url }) => url);

        watchedState.loadingProcess.status = 'receiving';
        watchedState.loadingProcess.error = null;
        watchedState.form.error = null;

        validate(data.url, urls)
          .then(() => {
            const link = getProxyLink(data.url);
            axios
              .get(link, { timeout: requestTimeout })
              .then((response) => {
                const xmlDoc = parser(response.data.contents);
                const { feed, posts } = xmlDoc;

                const feedWithIdAndUrl = {
                  ...feed,
                  id: uniqueId(),
                  url: data.url,
                };

                const postsWithId = posts.map((post) => ({
                  ...post,
                  id: uniqueId(),
                }));

                watchedState.feeds.unshift(feedWithIdAndUrl);
                watchedState.posts.unshift(...postsWithId);
                watchedState.loadingProcess.status = 'received';

                watchVisitedPost(watchedState, { elements });
                fetchNewData(watchedState);
              })
              .catch((error) => {
                watchedState.loadingProcess.status = 'failed';
                watchedState.loadingProcess.error = getErrorType(error);
                console.log(i18nInstance.t(getErrorType(error)));
              });
          })
          .catch((error) => {
            watchedState.loadingProcess.status = 'failed';
            watchedState.form.error = error.message;
            console.log(i18nInstance.t(error.message));
          });
      });
    })
    .catch((error) => console.log(error.message));
};
