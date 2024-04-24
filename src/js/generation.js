export const generatePost = (post) => {
  const postCard = document.createElement('li');
  postCard.classList.add('list-group-item');
  const date = new Date(post.publicationDate);
  const postHTML = `
      <p class="text-body-secondary small font-monospace">
        ${date.toDateString()}
      </p>
      <a href="${post.link}" target="_blank" class="fw-bold" style="display: block">
        ${post.title}
      </a>
      <button 
        class="btn btn-outline-secondary view btn-sm my-3 font-monospace" 
        style="--bs-btn-padding-y: .25rem; --bs-btn-padding-x: .50rem; --bs-btn-font-size: .75rem;"
        type="button" 
        data-feed="${post.idFeed}"
        data-title="${post.title}"
        data-bs-toggle="modal" 
        data-bs-target="#exampleModal"
      >
        Просмотр
      </button>
    `;
  postCard.innerHTML = postHTML;

  return postCard;
};

const generateFeed = (title, description) => {
  const cardBodyFeed = document.createElement('div');
  cardBodyFeed.classList.add('card-body', 'font-monospace');
  const titleFeed = document.createElement('h4');
  titleFeed.textContent = title;
  titleFeed.classList.add('h5', 'pt-3', 'pb-2', 'font-monospace');
  const descriptionFeed = document.createElement('p');
  descriptionFeed.textContent = description;
  cardBodyFeed.appendChild(titleFeed);
  cardBodyFeed.appendChild(descriptionFeed);

  return cardBodyFeed;
};

export const generateFeeds = (feed) => {
  const containerFeed = document.getElementById('feeds');
  const cardBodyFeed = generateFeed(feed.title, feed.description);
  containerFeed.prepend(cardBodyFeed);
};

export const generatePosts = (posts, watchedState) => {
  const containerPost = document.getElementById('posts');

  [...posts].reverse().forEach((post) => {
    containerPost.prepend(generatePost(post, watchedState));
  });
};
