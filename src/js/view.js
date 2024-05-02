import i18next from 'i18next';

import { generatePosts, generateFeeds } from './generation';

const INPUT_SELECTOR = 'input[name="url"]';

const handleError = (error) => {
  const errorMessage = document.getElementById('rssError');
  const input = document.querySelector(INPUT_SELECTOR);

  input.classList.remove('is-invalid');
  errorMessage.classList.add('invisible');
  errorMessage.classList.remove('invisible');
  errorMessage.textContent = error;
};

const handleSuccess = (status) => {
  const successMessage = document.getElementById('rssSuccess');

  successMessage.classList.add('invisible');

  if (status === 'success') {
    successMessage.classList.remove('invisible');
    successMessage.classList.add('visible');
  }
};

const someImportWatchFn = (state, path, value) => {
  const form = document.querySelector('form');
  const input = document.querySelector(INPUT_SELECTOR);
  const submit = document.querySelector('button[type="submit"]');
  const buttonSent = document.querySelector('span[role="status"]');

  if (path === 'uiState.modalData') {
    const post = state.posts.find(({ title }) => title === value);

    const modalContent = document.querySelector('.modal-body');
    const modalLink = document.querySelector('.modal-link');
    const modalTitle = document.querySelector('.modal-title');
    const link = document.querySelector(`[href = '${post.link}']`);

    link.classList.add('fw-normal');
    modalContent.innerHTML = post.description;
    modalLink.setAttribute('href', post.link);
    modalTitle.textContent = post.title;
  }

  if (state.statusUpdate === 'update') {
    submit.disabled = false;
    generatePosts(state.posts);
  }

  switch (state.statusPage) {
    case 'waiting':
      input.focus();
      submit.disabled = false;
      break;

    case 'loading':
      submit.disabled = true;
      document.getElementById('spiner').classList.remove('d-none');
      buttonSent.textContent = i18next.t('submitSpiner');
      break;

    case 'success':
      submit.disabled = false;
      if (state.activeFeed !== null) {
        const posts = state.posts
          .filter((post) => post.idFeed === state.activeFeed.idFeed);
        generatePosts(posts);
        generateFeeds(state.activeFeed);
      }

      input.focus();
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      form.reset();
      break;

    case 'error':
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      handleError(i18next.t(`errors.${state.error}`));
      break;

    default:
      break;
  }

  handleSuccess(state.statusPage);

  if (state.feeds.length !== 0) {
    document.getElementById('postH2').classList.remove('d-none');
    document.getElementById('feedH2').classList.remove('d-none');
  }
};

export default someImportWatchFn;
