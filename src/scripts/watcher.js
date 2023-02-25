/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';

export default (state, { elements }) => onChange(state, (path, current, previous) => {
  // console.log(state, current, previous);
  if (current) {
    elements.feedback.textContent = state.urlForm.error;
    elements.feedback.classList.add('text-danger');
    elements.feedback.classList.remove('text-success');
    elements.input.classList.add('is-invalid');
  } else {
    elements.form.reset();
    elements.input.focus();
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = 'RSS успешно загружен';
    elements.feedback.classList.add('text-success');
    elements.feedback.classList.remove('text-danger');
  }
});
