/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';

const renderHeader = (container, key, i18nInstance) => { // container vs wrapper
  const wrapper = document.createElement('div');
  wrapper.classList.add('card-body');
  container.append(wrapper);

  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = i18nInstance.t(key);
  wrapper.append(header);
};

const renderPostsItems = (state, container, i18nInstance) => {
  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  const feedsItems = state.posts;
  // console.log(feedsItems);
  const items = feedsItems.map((item, i) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    console.log(item, i);

    const link = document.createElement('a');
    link.classList.add('fw-bold');
    link.setAttribute('href', item.itemLink);
    link.setAttribute('data-id', item.itemId);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer'); // ?
    link.textContent = item.itemTitle;
    li.append(link);

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', item.itemId);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.textContent = i18nInstance.t('view');
    li.append(button);

    return li;
  });

  list.append(...items);
  container.append(list);
};

const renderPosts = (state, { elements }, i18nInstance) => {
  const container = elements.posts;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('card', 'border-0');
  container.append(wrapper);
  renderHeader(wrapper, 'posts', i18nInstance);
  renderPostsItems(state, wrapper, i18nInstance);
};

const renderFeedsItems = (state, container) => {
  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');
  const feedsItems = state.feeds;

  const items = feedsItems.map((item) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    // console.log(item);

    const header = document.createElement('h3');
    header.classList.add('h6', 'm-0');
    header.textContent = item.channelTitle;
    li.append(header);

    const description = document.createElement('p');
    description.classList.add('m-0', 'small', 'text-black-50');
    description.textContent = item.channelDescription;
    li.append(description);

    return li;
  });

  list.append(...items);
  container.append(list);
};

const renderFeeds = (state, { elements }, i18nInstance) => {
  const container = elements.feeds;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('card', 'border-0');
  container.append(wrapper);
  renderHeader(wrapper, 'feeds', i18nInstance);
  renderFeedsItems(state, wrapper);
};

export default (state, { elements }, i18nInstance) => onChange(state, (path, current, previous) => {
  // console.log(state, current, previous);
  if (current) { // invalid
    elements.feedback.textContent = i18nInstance.t(state.urlForm.error);
    elements.feedback.classList.add('text-danger');
    elements.feedback.classList.remove('text-success');
    elements.input.classList.add('is-invalid');
  } else { // valid
    elements.form.reset();
    elements.input.focus();
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = i18nInstance.t('loadingSuccess');
    elements.feedback.classList.add('text-success');
    elements.feedback.classList.remove('text-danger');
    renderFeeds(state, { elements }, i18nInstance);
    renderPosts(state, { elements }, i18nInstance);
  }
});
