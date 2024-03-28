import onChange from 'on-change';
import i18next from 'i18next';

import { generatePosts, generateFeeds, generatePost } from './generation';

const INPUT_SELECTOR = 'input[name="url"]';

const state = {
  // error loading success waiting
  status: 'waiting',
  // waiting, loading
  updatingStatus: 'waiting',
  data: {
    feeds: [],
    activeFeed: '',
    content: {},
  },
  error: null,
};

const handleErrors = (error) => {
  const errorMessage = document.getElementById('rssError');
  const input = document.querySelector(INPUT_SELECTOR);

  input.classList.remove('is-invalid');
  errorMessage.classList.add('invisible');

  if (error) {
    errorMessage.classList.remove('invisible');
    errorMessage.textContent = error;
  }
};

const handleSuccess = (status) => {
  const successMessage = document.getElementById('rssSuccess');

  successMessage.classList.add('invisible');

  if (status === 'success') {
    successMessage.classList.remove('invisible');
  }
};

const form = document.querySelector('form');

const watchedState = onChange(state, () => {
  const input = document.querySelector(INPUT_SELECTOR);
  const submit = document.querySelector('button[type="submit"]');

  handleErrors(state.error);
  handleSuccess(state.status);

  const buttonSent = document.querySelector('span[role="status"]');
  submit.disabled = false;

  if (state.updatingStatus === 'loading') {
    state.data.feeds.forEach((feed) => {
      const posts = state.data.content[feed].newPosts;
      state.data.content[feed].newPosts = [];

      if (posts.length === 0) {
        return;
      }

      posts.reverse().forEach((item) => {
        const containerPost = document.getElementById('posts');
        containerPost.prepend(generatePost(item));
      });
    });

    state.updatingStatus = 'waiting';
  }

  switch (state.status) {
    case 'waiting':
      input.focus();
      break;

    case 'loading':
      submit.disabled = true;
      document.getElementById('spiner').classList.remove('d-none');
      buttonSent.textContent = i18next.t('submitSpiner');
      break;

    case 'success':
      if (state.data.activeFeed.length !== 0) {
        generatePosts(state.data.activeFeed);
        generateFeeds(state.data.activeFeed);
        state.data.activeFeed = '';
      }

      input.focus();
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      form.reset();
      break;

    case 'error':
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');

      break;

    default:
      break;
  }

  if (state.data.feeds.length !== 0) {
    document.getElementById('postH2').classList.remove('d-none');
    document.getElementById('feedH2').classList.remove('d-none');
  }
});

export default watchedState;
