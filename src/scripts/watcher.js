/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';

export default (state, { elements }, i18nInstance) => onChange(state, (path, current, previous) => {
  // console.log(state, current, previous);
  if (current) {
    elements.feedback.textContent = i18nInstance.t(state.urlForm.error);
    elements.feedback.classList.add('text-danger');
    elements.feedback.classList.remove('text-success');
    elements.input.classList.add('is-invalid');
  } else {
    elements.form.reset();
    elements.input.focus();
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = i18nInstance.t('loadingSuccess');
    elements.feedback.classList.add('text-success');
    elements.feedback.classList.remove('text-danger');
  }
});
