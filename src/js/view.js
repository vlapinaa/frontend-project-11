import i18next from 'i18next';

import { generatePosts, generateFeeds } from './generation';

const INPUT_SELECTOR = 'input[name="url"]';

const handleErrors = (errors) => {
  const errorMessage = document.getElementById('rssError');
  const input = document.querySelector(INPUT_SELECTOR);

  input.classList.remove('is-invalid');
  errorMessage.classList.add('invisible');
  errors.forEach((error) => {
    if (error) {
      errorMessage.classList.remove('invisible');
      errorMessage.textContent = error;
    }
  });
};

const handleSuccess = (status) => {
  const successMessage = document.getElementById('rssSuccess');

  successMessage.classList.add('invisible');

  if (status === 'success') {
    successMessage.classList.remove('invisible');
    successMessage.classList.add('visible');
  }
};

const form = document.querySelector('form');

const someImportWatchFn = (state, path, value) => {
  const input = document.querySelector(INPUT_SELECTOR);
  const submit = document.querySelector('button[type="submit"]');
  const buttonSent = document.querySelector('span[role="status"]');

  submit.disabled = false;

  if (path === 'data.newPosts') {
    generatePosts(value, state.data.modalData);
  }

  if (path === 'data.modalData') {
    const post = state.data.posts.find(({ title }) => title === value);

    const modalContent = document.querySelector('.modal-body');
    const modalLink = document.querySelector('.modal-link');
    const modalTitle = document.querySelector('.modal-title');
    const link = document.querySelector(`[href = '${post.link}']`);

    link.classList.add('fw-normal');
    modalContent.innerHTML = post.description;
    modalLink.setAttribute('href', post.link);
    modalTitle.textContent = post.title;
  }

  switch (state.statusPage) {
    case 'waiting':
      input.focus();
      break;

    case 'loading':
      submit.disabled = true;
      document.getElementById('spiner').classList.remove('d-none');
      buttonSent.textContent = i18next.t('submitSpiner');
      break;

    case 'success':
      if (state.data.activeFeed !== null) {
        const posts = state.data.posts
          .filter((post) => post.idFeed === state.data.activeFeed.idFeed);
        generatePosts(posts, state.data.modalData);
        generateFeeds(state.data.activeFeed);
        // eslint-disable-next-line no-param-reassign
        state.data.activeFeed = null;
      }

      input.focus();
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      form.reset();
      break;

    case 'errors.url':
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      switch (value) {
        case 'required':
          // eslint-disable-next-line no-param-reassign
          state.errors.url = i18next.t('errors.requiredUrl');
          break;

        case 'url':
          // eslint-disable-next-line no-param-reassign
          state.errors.url = i18next.t('errors.incorrectUrl');
          break;

        case 'duplicate':
          // eslint-disable-next-line no-param-reassign
          state.errors.url = i18next.t('errors.duplicatedUrl');
          break;

        default:
          break;
      }
      break;

    case 'errors.network':
      // eslint-disable-next-line no-param-reassign
      state.errors.network = i18next.t('errors.network');
      break;

    case 'errors.rss':
      // eslint-disable-next-line no-param-reassign
      state.errors.rss = i18next.t('errors.incorrectRSS');
      break;

    default:
      break;
  }

  handleErrors([
    state.errors.rss,
    state.errors.network,
    state.errors.url,
  ]);
  handleSuccess(state.statusPage);

  if (state.data.feeds.length !== 0) {
    document.getElementById('postH2').classList.remove('d-none');
    document.getElementById('feedH2').classList.remove('d-none');
  }
};

export default someImportWatchFn;
