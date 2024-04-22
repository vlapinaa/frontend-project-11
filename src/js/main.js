import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';

import '../scss/styles.scss';
import parseRSS from './parsing';
import watchedState from './view';
// import transformXmlItem from './helpers';
import resources from '../locales/ru';

const getRSS = (url) => axios.get('https://allorigins.hexlet.app/get', {
  params: {
    url,
    disableCache: true,
  },
})
  .then((response) => response.data)
  .catch(() => {
    watchedState.statusPage = 'errorNetwork';
    watchedState.errorNetwork = 'Ошибка сети';
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
    console.log('newPosts', newPosts);
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
      // feed.newPosts = [];
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

export default () => {
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
        .required(i18next.t('errors.requiredUrl'))
        .url(i18next.t('errors.incorrectUrl'))
        .test({
          name: 'is-url-added',
          skipAbsent: false,
          test(value, context) {
            if (watchedState.data.feeds.nameFeed.includes(value)) {
              return context.createError({ message: i18next.t('errors.duplicatedUrl') });
            }
            return true;
          },
        }),
    });

    document.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const inputUrl = formData.get('url');

      watchedState.statusPage = 'loading';
      watchedState.errorRSS = null;
      watchedState.errorUrl = null;
      watchedState.errorNetwork = null;

      shemaUrl.validate({ url: inputUrl })
        .then(() => {
          getRSS(inputUrl)
            .then((data) => {
              const { transformXmlItem, feed } = parseRSS(data);

              const idFeed = uniqueId();
              const activeFeed = { nameFeed: inputUrl, idFeed, ...feed };
              watchedState.data.feeds.push(activeFeed);
              // feed.newPosts = [];
              const posts = transformXmlItem.map((item) => ({ ...item, idFeed }));

              watchedState.data.posts = [...posts, ...watchedState.data.posts];
              watchedState.data.activeFeed = { ...activeFeed };

              // console.log('parsing', posts, activeFeed, 'state', watchedState.data.posts, 'active', watchedState.data.activeFeed);

              watchedState.statusPage = 'success';
            })
            .catch((error) => {
              if (error.name === 'incorrectRSS') {
                watchedState.statusPage = 'errorRSS';
                watchedState.errorRSS = i18next.t('errors.incorrectRSS');
                return;
              }

              throw new Error(`Error: ${error}`);
            });
        })
        .catch((err) => {
          watchedState.statusPage = 'errorUrl';
          watchedState.errorUrl = err.message;
        });
    });

    addNewPosts();
  });
};
