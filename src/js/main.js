import '../scss/styles.scss';
import * as yup from 'yup';
import i18next from 'i18next';
import * as bootstrap from 'bootstrap';
import { generatePosts, generateFeeds, generatePost } from './generation';
import { parseRSS } from './parsing';
import createWatchedState from './view';
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

const state = {
  // filling sending sent
  status: 'filling',
  data: {
    feeds: [],
    content: {},
  },
  error: '',
};

const watchedState = createWatchedState(state);

const shemaUrl = yup.object({
  url: yup.string()
    .required(i18next.t('errors.requiredUrl'))
    .url(i18next.t('errors.incorrectUrl'))
    .test({
      name: 'is-url-added',
      skipAbsent: false,
      test(value, context) {
        if (state.data.feeds.includes(value)) {
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
  if (state.status === 'sent') {
    setTimeout(updatePosts, 5000);

    state.data.feeds.forEach((feed) => {
      parseRSS(feed).then((xmlDocument) => {
        const items = xmlDocument.querySelectorAll('item');
        const newPosts = [];

        const itemsArray = Array.from(items);
        const lastPost = state.data.content[feed].posts[0];
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

        state.data.content[feed].posts = [...newPosts.reverse(), ...state.data.content[feed].posts];
      });
    });
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const inputUrl = formData.get('url');

  shemaUrl.validate({ url: inputUrl })
    .then(() => {
      watchedState.status = 'sending';
      parseRSS(inputUrl).then((xmlDocument) => {
        const items = xmlDocument.querySelectorAll('item');

        const feed = {
          title: xmlDocument.querySelector('title').textContent,
          description: xmlDocument.querySelector('description').textContent,
          posts: Array.from(items).map((item) => transformXmlItem(inputUrl, item)),
        };

        state.data.content[inputUrl] = feed;

        generatePosts(feed);
        generateFeeds(feed);

        input.focus();
        form.reset();
        watchedState.data.feeds.push(inputUrl);
        watchedState.error = '';
        watchedState.status = 'sent';
      })
        .catch((error) => {
          if (error.name === 'incorrectRSS') {
            watchedState.status = 'filling';
            watchedState.error = i18next.t('errors.incorrectRSS');
            return;
          }
          throw new Error(`Error: ${error}`);
        });
    })
    .catch((err) => {
      watchedState.status = 'filling';
      watchedState.error = err.message;
    });
});

updatePosts();
