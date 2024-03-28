import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';

import '../scss/styles.scss';
import parseRSS from './parsing';
import watchedState from './view';
import transformXmlItem from './helpers';

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
    disableCache: true,
  },
})
  .then((response) => response.data)
  .catch(() => {
    watchedState.status = 'error';
    watchedState.error = 'Ошибка сети';
  });

const addNewPosts = () => {
  const handleFeed = (feed, url) => {
    const { newPosts } = watchedState.data.content[url];
    const lastPost = watchedState.data.content[url].posts[0];
    const lastPostDate = new Date(lastPost.publicationDate);
    const feedPosts = feed.posts;

    feedPosts.forEach((item) => {
      const pubDate = new Date(item.publicationDate);
      if (lastPostDate.getTime() >= pubDate.getTime()) {
        return;
      }

      newPosts.push(item);
    });

    watchedState.data.content[url].posts = [
      ...newPosts.reverse(),
      ...watchedState.data.content[url].posts,
    ];
  };

  const feedsPromises = watchedState.data.feeds.map((url) => getRSS(url)
    .then((data) => {
      const feed = parseRSS(data);
      feed.posts = feed.posts.map((item) => transformXmlItem(url, item));
      handleFeed(feed, url);
    }));

  Promise.all(feedsPromises).finally(() => {
    watchedState.updatingStatus = 'loading';
  }).then(() => {
    setTimeout(addNewPosts, 5000);
  });
};

document.addEventListener('DOMContentLoaded', () => {
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
            duplicatedUrl: 'RSS уже существует',
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

  document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputUrl = formData.get('url');

    watchedState.status = 'loading';

    shemaUrl.validate({ url: inputUrl })
      .then(() => {
        getRSS(inputUrl)
          .then((data) => {
            const feed = parseRSS(data);
            feed.posts = feed.posts.map((item) => transformXmlItem(inputUrl, item));

            watchedState.data.content[inputUrl] = feed;
            watchedState.data.activeFeed = feed;

            watchedState.status = 'success';

            watchedState.data.feeds.push(inputUrl);
            watchedState.error = null;
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

  addNewPosts();
});
