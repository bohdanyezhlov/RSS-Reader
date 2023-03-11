import onChange from 'on-change';
import { last, includes } from 'lodash';

const watchVisitedPosts = (state, { elements }) => {
  const visitedId = last(state.ui.posts.visitedIds);
  const postLink = document.querySelector(`a[data-id="${visitedId}"]`);
  postLink.classList.remove('fw-bold');
  postLink.classList.add('fw-normal', 'link-secondary');

  const post = state.posts.find(({ itemId }) => itemId === visitedId);
  elements.modalHeader.textContent = post.itemTitle;
  elements.modalText.textContent = post.itemDescription;
  elements.modalLink.setAttribute('href', post.itemLink);
};

const renderHeader = (container, key, i18nInstance) => {
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
  const items = feedsItems.map((item) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const link = document.createElement('a');
    const visitedPosts = state.ui.posts.visitedIds;
    if (includes(visitedPosts, item.itemId)) {
      link.classList.add('fw-normal', 'link-secondary');
    } else {
      link.classList.add('fw-bold');
    }
    link.setAttribute('href', item.itemLink);
    link.setAttribute('data-id', item.itemId);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
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

const renderSuccess = ({ elements }, i18nInstance) => {
  elements.form.reset();
  elements.input.focus();
  elements.input.classList.remove('is-invalid');
  elements.feedback.textContent = i18nInstance.t('loadingSuccess');
  elements.feedback.classList.add('text-success');
  elements.feedback.classList.remove('text-danger');
};

const renderError = ({ elements }, i18nInstance, curValue) => {
  if (curValue !== null) {
    elements.feedback.textContent = i18nInstance.t(curValue);
    elements.feedback.classList.add('text-danger');
    elements.feedback.classList.remove('text-success');
    elements.input.classList.add('is-invalid');
  }
};

const handleLoadingProcessStatus = ({ elements }, i18nInstance, processStatus) => {
  switch (processStatus) {
    case 'receiving':
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = '';
      elements.input.readOnly = true;
      elements.button.disabled = true;
      break;

    case 'failed':
      renderError({ elements }, i18nInstance, processStatus);
      elements.input.readOnly = false;
      elements.button.disabled = false;
      break;

    case 'received':
      renderSuccess({ elements }, i18nInstance);
      elements.input.readOnly = false;
      elements.button.disabled = false;
      break;

    default:
      throw new Error(`Unknown process status: ${processStatus}`);
  }
};

export default (state, { elements }, i18nInstance) => (
  onChange(state, (path, curValue) => {
    console.log(state, 'path', path, 'current', curValue);
    switch (path) {
      case 'form.error':
        renderError({ elements }, i18nInstance, curValue);
        break;

      case 'loadingProcess.status':
        handleLoadingProcessStatus({ elements }, i18nInstance, curValue);
        break;

      case 'loadingProcess.error':
        renderError({ elements }, i18nInstance, curValue);
        break;

      case 'feeds':
        renderFeeds(state, { elements }, i18nInstance);
        break;

      case 'posts':
        renderPosts(state, { elements }, i18nInstance);
        break;

      case 'ui.posts.visitedIds':
        watchVisitedPosts(state, { elements });
        break;

      default:
        break;
    }
  })
);
