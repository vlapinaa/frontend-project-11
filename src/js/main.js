import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import onChange from 'on-change';

import '../scss/styles.scss';
import parseRSS from './parsing';
import someImportWatchFn from './view';
import resources from '../locales/ru';

export default () => {
  const state = {
    // error loading success waiting update
    statusPage: 'waiting',
    activeFeed: null,
    feeds: [],
    posts: [],
    uiState: {
      modalData: null,
      // waiting update
      statusUpdate: 'waiting',
    },
    error: null,
  };
  const watchedState = onChange(state, (path, value) => {
    someImportWatchFn(state, path, value);
  });

  const getRSS = (url) => axios.get('https://allorigins.hexlet.app/get', {
    params: {
      url,
      disableCache: true,
    },
  })
    .then((response) => response.data)
    .catch(() => {
      watchedState.statusPage = 'error';
      watchedState.error = 'network';
    });

  const updatingPosts = () => {
    const handleFeed = (posts, idFeedNow) => {
      watchedState.statusUpdate = 'waiting';
      const oldPosts = watchedState.posts.filter((post) => post.idFeed === idFeedNow);
      const lastPost = oldPosts[0];
      if (!lastPost) {
        return;
      }
      const lastPostDate = new Date(lastPost.pubDate);
      const feedPosts = posts;

      const newPosts = feedPosts.filter((item) => {
        const pubDate = new Date(item.pubDate);
        return lastPostDate.getTime() < pubDate.getTime();
      });
      if (newPosts.length !== 0) {
        watchedState.posts = [
          ...newPosts,
          ...watchedState.posts,
        ];
        watchedState.statusUpdate = 'update';
      }
    };

    const feedsPromises = watchedState.feeds.map(({ nameFeed, idFeed }) => getRSS(nameFeed)
      .then((data) => {
        const { items } = parseRSS(data);
        const posts = items.map((item) => ({ ...item, idFeed }));
        handleFeed(posts, idFeed);
      }));

    Promise.all(feedsPromises)
      .then(() => {
        setTimeout(updatingPosts, 5000);
      })
      .catch((err) => {
        throw new Error(`Error update: ${err}`);
      });
  };

  i18next.init({
    lng: 'ru',
    resources,
  }).then((t) => {
    document.getElementById('title').textContent = t('title');
    document.getElementById('subTitle').textContent = t('subTitle');
    document.getElementById('labelForInput').textContent = t('label');
    document.querySelector('span[role="status"]').textContent = t('submitButton');
    document.getElementById('rssSuccess').textContent = t('successMessage');

    const shemaUrl = yup.object({
      url: yup.string()
        .required('requiredUrl')
        .url('incorrectUrl')
        .test({
          name: 'is-url-added',
          skipAbsent: false,
          test(value, context) {
            const findFeed = watchedState.feeds.filter(({ nameFeed }) => nameFeed === value);
            return findFeed.length !== 0
              ? context.createError({ message: 'duplicatedUrl' })
              : true;
          },
        }),
    });

    document.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputUrl = formData.get('url');

      watchedState.statusPage = 'loading';
      watchedState.error = null;

      shemaUrl.validate({ url: inputUrl })
        .then(() => {
          getRSS(inputUrl)
            .then((data) => {
              const { items, title, description } = parseRSS(data);

              const idFeed = uniqueId();
              const activeFeed = {
                nameFeed: inputUrl, idFeed, title, description,
              };
              watchedState.feeds.push(activeFeed);
              const posts = items.map((item) => ({ ...item, idFeed }));

              watchedState.posts = [...posts, ...watchedState.posts];
              watchedState.activeFeed = { ...activeFeed };

              watchedState.statusPage = 'success';
              watchedState.activeFeed = null;
            })
            .catch((error) => {
              if (error.name === 'incorrectRSS') {
                watchedState.statusPage = 'error';
                watchedState.error = 'incorrectRSS';
                return;
              }

              throw new Error(`Error: ${error}`);
            });
        })
        .catch((err) => {
          watchedState.statusPage = 'error';
          watchedState.error = err.message;
        });
    });
    document.getElementById('posts').addEventListener('click', (event) => {
      const { target } = event;

      if (target.tagName !== 'BUTTON') {
        return;
      }
      const titlePost = target.getAttribute('data-title');
      watchedState.uiState.modalData = titlePost;
    });

    updatingPosts();
  });
};
