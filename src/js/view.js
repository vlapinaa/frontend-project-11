import onChange from 'on-change';
import i18next from 'i18next';

const input = document.querySelector('input[name="url"]');
const errorMessage = document.getElementById('rssError');
const successMessage = document.getElementById('rssSuccess');
const submit = document.querySelector('button[type="submit"]');

const state = {
  // error loading success waiting
  status: 'waiting',
  // waiting, loading
  updatingStatus: 'waiting',
  data: {
    feeds: [],
    content: {},
  },
  error: '',
};

const handleErrors = (error) => {
  input.classList.remove('is-invalid');
  errorMessage.classList.add('invisible');

  if (error) {
    errorMessage.classList.remove('invisible');
    errorMessage.textContent = error;
  }
};

const handleSuccess = (status) => {
  successMessage.classList.add('invisible');

  if (status === 'success') {
    successMessage.classList.remove('invisible');
  }
};

const watchedState = onChange(state, () => {
  handleErrors(state.error);
  handleSuccess(state.status);
  const buttonSent = document.querySelector('span[role="status"]');
  submit.disabled = false;

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
      input.focus();
      document.getElementById('spiner').classList.add('d-none');
      buttonSent.textContent = i18next.t('submitButton');
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
