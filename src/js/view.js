import onChange from 'on-change';
import i18next from 'i18next';

const input = document.querySelector('input[name="url"]');
const errorMessage = document.getElementById('rssError');
const successMessage = document.getElementById('rssSuccess');
const submit = document.querySelector('button[type="submit"]');

const handleErrors = (error) => {
  input.classList.remove('is-invalid');
  errorMessage.classList.remove('d-block');
  errorMessage.classList.add('d-none');

  if (error) {
    errorMessage.classList.remove('d-none');
    errorMessage.classList.add('d-block');
    errorMessage.textContent = error;
  }
};

const handleSuccess = (status) => {
  successMessage.classList.remove('d-block');
  successMessage.classList.add('d-none');

  if (status === 'sent') {
    successMessage.classList.remove('d-none');
    successMessage.classList.add('d-block');
  }
};

export default (state) => onChange(state, (path, value) => {
  handleErrors(state.error);
  handleSuccess(state.status);
  const buttonSent = document.querySelector('span[role="status"]');
  submit.disabled = false;
  if (state.status === 'sending') {
    submit.disabled = true;
    document.getElementById('spiner').classList.remove('d-none');
    buttonSent.textContent = i18next.t('submitSpiner');
  }
  if (state.status === 'sent') {
    document.getElementById('spiner').classList.add('d-none');
    buttonSent.textContent = i18next.t('submitButton');
  }
  if (state.data.feeds.length !== 0) {
    document.getElementById('postH2').classList.remove('d-none');
    document.getElementById('feedH2').classList.remove('d-none');
  }
});
