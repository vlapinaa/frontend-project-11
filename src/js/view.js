import onChange from 'on-change';
import i18next from 'i18next';

import { generatePosts, generateFeeds, generatePost } from './generation';

const INPUT_SELECTOR = 'input[name="url"]';

const state = {
  // error loading success waiting
  statusPage: 'waiting',
  // waiting, loading
  updatingStatus: 'waiting',
  data: {
    activeFeed: null,
    feeds: [],
    posts: [],
    newPosts: [],
  },
  errorRSS: null,
  errorNetwork: null,
  errorUrl: null,
};

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
  }
};

const form = document.querySelector('form');

const watchedState = onChange(state, (path, value) => {
  const input = document.querySelector(INPUT_SELECTOR);
  const submit = document.querySelector('button[type="submit"]');
  handleErrors([state.errorUrl, state.errorRSS, state.errorNetwork]);
  handleSuccess(state.statusPage);

  const buttonSent = document.querySelector('span[role="status"]');
  submit.disabled = false;
  if (path === 'data.newPosts') {
    generatePosts(value);
    console.log('value', value);
  }

  if (state.updatingStatus === 'loading') {
    // state.data.feeds.forEach(({ nameFeed }) => {
    //   const posts = state.data.feeds[nameFeed];
    //   // state.data.content[nameFeed].newPosts = [];

    //   if (posts.length === 0) {
    //     return;
    //   }

    //   posts.reverse().forEach((item) => {
    //     const containerPost = document.getElementById('posts');
    //     containerPost.prepend(generatePost(item));
    //   });
    // });

    state.updatingStatus = 'waiting';
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
        generatePosts(posts);
        generateFeeds(state.data.activeFeed);
        state.data.activeFeed = null;
      }

      input.focus();
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
      form.reset();
      break;

    case 'errorRSS':
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');

      break;

    case 'errorUrl':
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');

      break;

    case 'errorNetwork':
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
