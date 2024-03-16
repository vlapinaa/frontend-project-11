import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import '../scss/styles.scss';
import { generatePosts, generateFeeds, generatePost } from './generation';
import { parseRSS } from './parsing';
import watchedState from './view';

i18next.init({
  lng: 'ru',
  resources: {
    ru: {
      translation: {
        title: 'RSS агрегатор',
        subTitle: 'Начните читать RSS сегодня! Это легко, это красиво.',
        label: 'Ссылка RSS',
        submitButton: 'Добавить',
        submitSpiner: 'Loading...',
        successMessage: 'RSS успешно загружен',
        errors: {
          incorrectUrl: 'Ссылка должна быть валидным URL',
          requiredUrl: 'Не должно быть пусты',
          duplicatedUrl: 'RSS уже добавлен',
          incorrectRSS: 'Ресурс не содержит валидный RSS',
        },
      },
    },
  },
}).then((t) => {
  document.getElementById('title').textContent = t('title');
  document.getElementById('subTitle').textContent = t('subTitle');
  document.getElementById('labelForInput').textContent = t('label');
  document.querySelector('span[role="status"]').textContent = t('submitButton');
  document.getElementById('rssSuccess').textContent = t('successMessage');
});

const shemaUrl = yup.object({
  url: yup.string()
    .required(i18next.t('errors.requiredUrl'))
    .url(i18next.t('errors.incorrectUrl'))
    .test({
      name: 'is-url-added',
      skipAbsent: false,
      test(value, context) {
        if (watchedState.data.feeds.includes(value)) {
          return context.createError({ message: i18next.t('errors.duplicatedUrl') });
        }
        return true;
      },
    }),
});

const getRSS = (url) => axios.get('https://allorigins.hexlet.app/get', {
  params: {
    url,
  },
})
  .then((response) => response.data);

const form = document.querySelector('form');

const addNewPosts = () => {
  const handleFeed = (feed, url) => {
    const newPosts = [];

    const lastPost = watchedState.data.content[url].posts[0];
    const lastPostDate = new Date(lastPost.publicationDate);
    const feedPosts = feed.posts;

    for (const item of feedPosts) {
      const pubDate = new Date(item.publicationDate);
      if (lastPostDate.getTime() >= pubDate.getTime()) {
        break;
      }

      newPosts.push(item);

      const containerPost = document.getElementById('posts');
      containerPost.prepend(generatePost(item));
    }

    watchedState.data.content[url].posts = [
      ...newPosts.reverse(),
      ...watchedState.data.content[url].posts,
    ];
  };

  const feedsPromises = watchedState.data.feeds.map((url) => getRSS(url)
    .then((data) => parseRSS(data, url))
    .then((feed) => { handleFeed(feed, url); }));

  return Promise.all(feedsPromises).finally(() => {
    watchedState.updatingStatus = 'waiting';
  });
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const inputUrl = formData.get('url');

  shemaUrl.validate({ url: inputUrl })
    .then(() => {
      watchedState.status = 'loading';

      getRSS(inputUrl)
        .then((data) => parseRSS(data, inputUrl))
        .then((feed) => {
          watchedState.data.content[inputUrl] = feed;

          generatePosts(feed);
          generateFeeds(feed);

          watchedState.data.feeds.push(inputUrl);
          watchedState.error = '';
          watchedState.status = 'success';
          form.reset();
        })
        .catch((error) => {
          if (error.name === 'incorrectRSS') {
            watchedState.status = 'error';
            watchedState.error = i18next.t('errors.incorrectRSS');
            return;
          }
          throw new Error(`Error: ${error}`);
        });
    })
    .catch((err) => {
      watchedState.status = 'error';
      watchedState.error = err.message;
    });
});

const updatePosts = () => {
  addNewPosts().then(() => {
    setTimeout(updatePosts, 5000);
  });
};

updatePosts();
