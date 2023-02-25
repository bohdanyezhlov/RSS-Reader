/* eslint-disable no-unused-vars */
import * as yup from 'yup';
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

// RSS уже существует, Ресурс не содержит валидный RSS, Ссылка должна быть валидным URL
export default () => {
  const state = {
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
      watchedState(state, { elements }).urlForm.error = 'RSS уже существует';
      // console.log('RSS уже существует', state.urlForm);
    } else {
      schema.validate(data)
        .then((valid) => {
          state.urlForm.urls.push(data.url);
          state.urlForm.valid = true;
          watchedState(state, { elements }).urlForm.error = '';
          // console.log('Valid URL', state.urlForm, valid);
        })
        .catch((error) => {
          state.urlForm.valid = false;
          watchedState(state, { elements }).urlForm.error = 'Ссылка должна быть валидным URL';
          // console.log('Ссылка должна быть валидным URL', state.urlForm, error);
        });
    }
  });
};
