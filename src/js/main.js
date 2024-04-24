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
    // error loading success waiting
    statusPage: 'waiting',
    // waiting, loading
    updatingStatus: 'waiting',
    data: {
      activeFeed: null,
      feeds: [],
      posts: [],
      newPosts: [],
      modalData: null,
    },
    errors: {
      rss: null,
      network: null,
      url: null,
    },
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
      watchedState.statusPage = 'errors.network';
    });

  const addNewPosts = () => {
    const handleFeed = (posts, idFeedNow) => {
      const oldPosts = watchedState.data.posts.filter((post) => post.idFeed === idFeedNow);
      const lastPost = oldPosts[0];
      const lastPostDate = new Date(lastPost.publicationDate);
      const feedPosts = posts;

      const newPosts = feedPosts.filter((item) => {
        const pubDate = new Date(item.publicationDate);
        return lastPostDate.getTime() < pubDate.getTime();
      });
      if (newPosts.length !== 0) {
        watchedState.data.newPosts = newPosts;
        watchedState.data.posts = [
          ...newPosts,
          ...watchedState.data.posts,
        ];
      }
    };

    const feedsPromises = watchedState.data.feeds.map(({ nameFeed, idFeed }) => getRSS(nameFeed)
      .then((data) => {
        const { transformXmlItem } = parseRSS(data);
        const posts = transformXmlItem.map((item) => ({ ...item, idFeed }));
        handleFeed(posts, idFeed);
      }));

    Promise.all(feedsPromises)
      .then(() => {
        setTimeout(addNewPosts, 5000);
      })
      .finally(() => {
        watchedState.updatingStatus = 'loading';
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
        .required('required')
        .url('url')
        .test({
          name: 'is-url-added',
          skipAbsent: false,
          test(value, context) {
            const findFeed = watchedState.data.feeds.filter(({ nameFeed }) => nameFeed === value);
            return findFeed.length !== 0
              ? context.createError({ message: 'duplicate' })
              : true;
          },
        }),
    });

    document.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputUrl = formData.get('url');

      watchedState.statusPage = 'loading';
      watchedState.errors.rss = null;
      watchedState.errors.network = null;
      watchedState.errors.url = null;

      shemaUrl.validate({ url: inputUrl })
        .then(() => {
          getRSS(inputUrl)
            .then((data) => {
              const { transformXmlItem, feed } = parseRSS(data);

              const idFeed = uniqueId();
              const activeFeed = { nameFeed: inputUrl, idFeed, ...feed };
              watchedState.data.feeds.push(activeFeed);
              const posts = transformXmlItem.map((item) => ({ ...item, idFeed }));

              watchedState.data.posts = [...posts, ...watchedState.data.posts];
              watchedState.data.activeFeed = { ...activeFeed };

              watchedState.statusPage = 'success';
            })
            .catch((error) => {
              if (error.name === 'incorrectRSS') {
                watchedState.statusPage = 'errors.rss';
                return;
              }

              throw new Error(`Error: ${error}`);
            });
        })
        .catch((err) => {
          watchedState.statusPage = 'errors.url';
          watchedState.errors.url = err.message;
        });
    });
    document.getElementById('posts').addEventListener('click', (event) => {
      const { target } = event;

      if (target.tagName !== 'BUTTON') {
        return;
      }
      const titlePost = target.getAttribute('data-title');
      watchedState.data.modalData = titlePost;
    });

    addNewPosts();
  });
};
