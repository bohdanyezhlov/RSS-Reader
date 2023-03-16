import onChange from 'on-change';
import { last } from 'lodash';

export default (state, { elements }, i18nInstance) => {
  const watchVisitedPosts = () => {
    const visitedId = last([...state.ui.posts.visitedIds]);
    const postLink = document.querySelector(`a[data-id="${visitedId}"]`);
    postLink.classList.remove('fw-bold');
    postLink.classList.add('fw-normal', 'link-secondary');

    const post = state.posts.find(({ id }) => id === visitedId);
    elements.modalHeader.textContent = post.title;
    elements.modalText.textContent = post.description;
    elements.modalLink.setAttribute('href', post.link);
  };

  const renderHeader = (container, title) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('card-body');
    container.append(wrapper);

    const header = document.createElement('h2');
    header.classList.add('card-title', 'h4');
    header.textContent = title;
    wrapper.append(header);
  };

  const renderPostsItems = (container) => {
    const list = document.createElement('ul');
    list.classList.add('list-group', 'border-0', 'rounded-0');

    const postsItems = state.posts;
    const items = postsItems.map((post) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

      const link = document.createElement('a');
      const visitedPosts = state.ui.posts.visitedIds;
      if (visitedPosts.has(post.id)) {
        link.classList.add('fw-normal', 'link-secondary');
      } else {
        link.classList.add('fw-bold');
      }
      link.setAttribute('href', post.link);
      link.setAttribute('data-id', post.id);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.textContent = post.title;
      li.append(link);

      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('data-id', post.id);
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

  const renderPosts = () => {
    const container = elements.posts;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('card', 'border-0');
    container.append(wrapper);

    const title = i18nInstance.t('posts');
    renderHeader(wrapper, title);
    renderPostsItems(wrapper);
  };

  const renderFeedsItems = (container) => {
    const list = document.createElement('ul');
    list.classList.add('list-group', 'border-0', 'rounded-0');
    const feedsItems = state.feeds;

    const items = feedsItems.map((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');

      const header = document.createElement('h3');
      header.classList.add('h6', 'm-0');
      header.textContent = feed.title;
      li.append(header);

      const description = document.createElement('p');
      description.classList.add('m-0', 'small', 'text-black-50');
      description.textContent = feed.description;
      li.append(description);

      return li;
    });

    list.append(...items);
    container.append(list);
  };

  const renderFeeds = () => {
    const container = elements.feeds;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('card', 'border-0');
    container.append(wrapper);

    const title = i18nInstance.t('feeds');
    renderHeader(wrapper, title);
    renderFeedsItems(wrapper);
  };

  const renderSuccess = () => {
    elements.form.reset();
    elements.input.focus();
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = i18nInstance.t('loadingSuccess');
    elements.feedback.classList.add('text-success');
    elements.feedback.classList.remove('text-danger');
  };

  const renderError = (value) => {
    if (value !== null) {
      elements.feedback.textContent = i18nInstance.t(value);
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      elements.input.classList.add('is-invalid');
    }
  };

  const handleLoadingProcessStatus = (processStatus) => {
    switch (processStatus) {
      case 'receiving':
        elements.input.classList.remove('is-invalid');
        elements.feedback.textContent = '';
        elements.input.readOnly = true;
        elements.button.disabled = true;
        break;

      case 'failed':
        renderError(processStatus);
        elements.input.readOnly = false;
        elements.button.disabled = false;
        break;

      case 'received':
        renderSuccess();
        elements.input.readOnly = false;
        elements.button.disabled = false;
        break;

      default:
        throw new Error(`Unknown process status: ${processStatus}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.error':
        renderError(value);
        break;

      case 'loadingProcess.status':
        handleLoadingProcessStatus(value);
        break;

      case 'loadingProcess.error':
        renderError(value);
        break;

      case 'feeds':
        renderFeeds();
        break;

      case 'posts':
        renderPosts();
        break;

      case 'ui.posts.visitedIds':
        watchVisitedPosts();
        break;

      default:
        break;
    }
  });

  return watchedState;
};
