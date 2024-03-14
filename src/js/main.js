import '../scss/styles.scss';
import * as yup from 'yup';
import i18next from 'i18next';
import * as bootstrap from 'bootstrap';
import { generatePosts, generateFeeds, generatePost } from './generation';
import { parseRSS } from './parsing';
import watchedState from './view';
import { transformXmlItem } from './helpers';

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

const input = document.querySelector('input[name="url"]');
const form = document.querySelector('form');

input.focus();

const updatePosts = () => {
  if (watchedState.status !== 'success') {
    return;
  }

  setTimeout(updatePosts, 5000);
  watchedState.status = 'updating';

  const handleFeed = (feed) => parseRSS(feed).then((xmlDocument) => {
    const items = xmlDocument.querySelectorAll('item');

    const newPosts = [];

    const itemsArray = Array.from(items);
    const lastPost = watchedState.data.content[feed].posts[0];
    const lastPostDate = new Date(lastPost.publicationDate);

    for (const item of itemsArray) {
      const pubDate = new Date(item.querySelector('pubDate').textContent);
      if (lastPostDate.getTime() >= pubDate.getTime()) {
        break;
      }

      const post = transformXmlItem(feed, item);
      newPosts.push(post);

      const containerPost = document.getElementById('posts');
      containerPost.prepend(generatePost(post));
    }

    watchedState.data.content[feed].posts = [
      ...newPosts.reverse(),
      ...watchedState.data.content[feed].posts,
    ];
  });

  const feedsPromises = watchedState.data.feeds.map((feed) => handleFeed(feed));

  Promise.all(feedsPromises).finally(() => {
    watchedState.status = 'success';
  });
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const inputUrl = formData.get('url');

  shemaUrl.validate({ url: inputUrl })
    .then(() => {
      watchedState.status = 'loading';
      parseRSS(inputUrl).then((xmlDocument) => {
        const items = xmlDocument.querySelectorAll('item');

        const feed = {
          title: xmlDocument.querySelector('title').textContent,
          description: xmlDocument.querySelector('description').textContent,
          posts: Array.from(items).map((item) => transformXmlItem(inputUrl, item)),
        };

        watchedState.data.content[inputUrl] = feed;

        generatePosts(feed);
        generateFeeds(feed);

        input.focus();
        form.reset();
        watchedState.data.feeds.push(inputUrl);
        watchedState.error = '';
        watchedState.status = 'success';
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
