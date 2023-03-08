import * as yup from 'yup';
import 'bootstrap';
import i18n from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import resources from './locales/index';
import render from './render';
import parser from './parser/index';

const watchVisitedPost = (view) => {
  document.addEventListener('click', (e) => {
    const visitedId = e.target.getAttribute('data-id');

    if (visitedId) {
      view.ui.posts.visitedId.push(visitedId);
    }
  });
};

const getProxyLink = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
const delay = 5000;

const fetchNewData = (state, view) => {
  const urls = state.feeds.map(({ url }) => url);
  const promises = urls.map((url) => {
    const link = getProxyLink(url);

    return axios.get(link)
      .then((response) => {
        const xmlDoc = parser(response.data.contents);

        // if (xmlDoc) { ?
        const { posts } = xmlDoc;
        const newPosts = posts
          .filter((obj2) => !state.posts
            .some((obj1) => obj1.itemTitle === obj2.itemTitle));

        if (newPosts.length) {
          const postsWithId = posts.map((post) => {
            post.itemId = uniqueId();
            return post;
          });
          view.posts.unshift(...postsWithId);
        }
        // }
      })
      .catch((e) => (
        e.message // invalid rss?
      ));
  });

  Promise.all(promises).then(() => {
    setTimeout(() => fetchNewData(state, view), delay);
  });
};

export default () => {
  const defaultLanguage = 'ru';

  const state = {
    lng: defaultLanguage,
    rssForm: {
      valid: null,
      status: null,
      error: null,
    },
    feeds: [],
    posts: [],
    ui: {
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
  })
    .then(() => {
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

      const view = render(state, { elements }, i18nInstance);

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
        const urls = state.feeds.map(({ url }) => url);
        const uniqUrlsSchema = baseUrlSchema.notOneOf(urls);

        uniqUrlsSchema.validate(data.url)
          .then(() => {
            view.rssForm.status = 'sending';

            const link = getProxyLink(data.url);
            axios.get(link)
              .then((response) => {
                const xmlDoc = parser(response.data.contents);

                if (xmlDoc) { // Valid RSS feed
                  const { feed, posts } = xmlDoc;
                  feed.id = uniqueId();
                  feed.url = data.url;
                  const postsWithId = posts.map((post) => {
                    const postWithId = post;
                    postWithId.itemId = uniqueId();
                    return postWithId;
                  });

                  state.feeds.unshift(feed);
                  state.posts.unshift(...postsWithId);
                  state.rssForm.error = '';
                  view.rssForm.valid = true;
                  state.rssForm.valid = null;
                  view.rssForm.status = 'finished';
                  watchVisitedPost(view);
                  fetchNewData(state, view);
                } else { // Invalid RSS feed
                  state.rssForm.error = 'noValidRss';
                  view.rssForm.valid = false;
                  state.rssForm.valid = null;
                  view.rssForm.status = 'finished';
                }
              })
              .catch((error) => {
                console.log(error.message, 'Ошибка сети или ?');

                state.rssForm.error = 'networkError';
                view.rssForm.valid = false;
                state.rssForm.valid = null;
                view.rssForm.status = 'finished';
              });
          })
          .catch((error) => {
            console.log(error, error.message);

            state.rssForm.error = error.message;
            view.rssForm.valid = false;
            state.rssForm.valid = null;
          });
      });
    })
    .catch((error) => console.log(error.message));
};
