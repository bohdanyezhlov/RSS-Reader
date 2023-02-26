/* eslint-disable no-unused-vars */
import * as yup from 'yup';
import i18n from 'i18next';
import resources from './locales/index.js';
import watchedState from './watcher';

const isUrlValid = (value) => new Promise((resolve, reject) => {
  try {
    const url = new URL(value);
    resolve(true);
  } catch (e) {
    resolve(false);
  }
});

const schema = yup.object().shape({
  url: yup.string()
    .required()
    .test('valid-url', 'Invalid URL', isUrlValid),
});

export default async () => {
  const defaultLanguage = 'ru';

  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    urlForm: {
      urls: [],
      valid: null,
      error: '',
    },
  };

  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('#url-input'),
    button: document.querySelector('button'),
    feedback: document.querySelector('.feedback'),
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUrl = (new FormData(e.target)).get('url');
    const data = {
      url: newUrl,
    };

    if (state.urlForm.urls.includes(data.url)) {
      state.urlForm.valid = false;
      watchedState(state, { elements }, i18nInstance).urlForm.error = 'alreadyExist';
      // console.log('RSS уже существует', state.urlForm);
    } else {
      schema.validate(data)
        .then((valid) => {
          state.urlForm.urls.push(data.url);
          state.urlForm.valid = true;
          watchedState(state, { elements }, i18nInstance).urlForm.error = '';
          // console.log('Valid URL', state.urlForm, valid);
        })
        .catch((error) => {
          state.urlForm.valid = false;
          watchedState(state, { elements }, i18nInstance).urlForm.error = 'invalidUrl';
          // console.log('Ссылка должна быть валидным URL', state.urlForm, error);
        });
    }
  });
};
