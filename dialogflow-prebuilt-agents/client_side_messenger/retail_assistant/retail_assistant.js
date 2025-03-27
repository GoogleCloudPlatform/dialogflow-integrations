// listen to df-response
window.addEventListener('df-response-received', (event) => {
    event.preventDefault();  // Dialogflow Messenger won't handle the responses.
  
    // check if flow's responses is available
    let flowPayloads = extractFlowPayloads(event.detail.raw);
  
    // check if generative responses is available
    let genResponses = extractGenerativeResponses(event.detail.raw);
  
    if (genResponses) {
      try {
        const dfMessenger = document.querySelector('df-messenger');
        for (const res of genResponses) {
          if (res.hasOwnProperty('agentUtterance')) {
            dfMessenger.renderCustomText(res.agentUtterance.text, true);
          } else if (res.hasOwnProperty('toolUse')) {
            let customPayload = extractCustomPayload(res.toolUse);
            if (customPayload) {
              dfMessenger.renderCustomCard(customPayload[0]);
            }
          } else if (
              res && res.flowInvocation &&
              res.flowInvocation.flowState == 'OUTPUT_STATE_OK') {
            for (const flowPayload of flowPayloads) {
              dfMessenger.renderCustomCard(flowPayload.payload.richContent[0]);
            }
          }
        }
      } catch (err) {
        console.log('error in generative response: ', err);
      }
    }
  });
  
  /**
   * Extract custom payload from dfTool
   * @param {Object!} dfTool
   * @return {?Object | boolean}
   */
  function extractCustomPayload(dfTool) {
    try {
      if (dfTool.outputActionParameters && dfTool.outputActionParameters['200'] &&
          dfTool.outputActionParameters['200'].payload &&
          dfTool.outputActionParameters['200'].payload.richContent) {
        return dfTool.outputActionParameters['200'].payload.richContent;
      } else {
        return false;
      }
    } catch (err) {
      console.log('error in tool response: ', err);
    }
  }
  
  /**
   * Extract generative responses from dfResponse
   * @param {Object!} dfResponse
   * @return {?Object | boolean}
   */
  function extractGenerativeResponses(dfResponse) {
    try {
      let dfActions =
          dfResponse.queryResult.generativeInfo.actionTracingInfo.actions;
      let filteredActions =
          dfActions.filter(action => !action.hasOwnProperty('userUtterance'));
  
      if (filteredActions.length > 0) return filteredActions;
  
      return false;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Extract flow payloads from dfResponse
   * @param {Object!} dfResponse
   * @return {?Object | boolean}
   */
  function extractFlowPayloads(dfResponse) {
    try {
      let flowResponses = dfResponse.queryResult.responseMessages;
      let flowPayloads =
          flowResponses.filter(response => response.hasOwnProperty('payload'));
  
      if (flowPayloads.length > 0) return flowPayloads;
  
      return false;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Setup html for custom components
   */
  function setupHtml() {
    console.log('setting up html');
    // Create the review container
    const reviewContainer = document.createElement('div');
    reviewContainer.id = 'review-template';
    reviewContainer.classList.add('review-container');
    reviewContainer.style.display = 'none';
  
    // Create the review element
    const review = document.createElement('div');
    review.classList.add('review');
  
    // Create the review header
    const reviewHeader = document.createElement('div');
    reviewHeader.classList.add('review-header');
  
    // Create the user avatar
    const userAvatar = document.createElement('div');
    userAvatar.classList.add('user-avatar');
  
    // Create the user info
    const userInfo = document.createElement('div');
    userInfo.classList.add('user-info');
  
    // Create the user name
    const userName = document.createElement('div');
    userName.classList.add('user-name');
  
    // Create the user rating
    const userRating = document.createElement('div');
    userRating.classList.add('user-rating');
  
    // Create the stars
    const stars = document.createElement('span');
    stars.classList.add('stars');
  
    // Create the rating score
    const ratingScore = document.createElement('span');
    ratingScore.classList.add('rating-score');
  
    // Create the review text
    const reviewText = document.createElement('p');
    reviewText.classList.add('review-text');
  
    // Create the review title
    const reviewTitle = document.createElement('p');
    reviewTitle.classList.add('review-title');
  
    // Append elements to their parents
    userRating.appendChild(stars);
    userRating.appendChild(ratingScore);
    userInfo.appendChild(userName);
    userInfo.appendChild(userRating);
    reviewHeader.appendChild(userAvatar);
    reviewHeader.appendChild(userInfo);
    review.appendChild(reviewHeader);
    review.appendChild(reviewText);
    review.appendChild(reviewTitle);
    reviewContainer.appendChild(review);
  
    // Insert the review container next to the <df-messenger>
    // dfMessenger.parentNode.insertBefore(reviewContainer,
    // dfMessenger.nextSibling);
    const chatWindowWrapper = document.querySelector('.chat-window-wrapper');
    chatWindowWrapper.append(reviewContainer);
    console.log({chatWindowWrapper});
  }
  
  // Element for retail example. Contact: bpataki@google.com
  class RetailTemplate extends HTMLElement {
    constructor() {
      super();
      this.dfPayload = null;
      this.dfResponseId = null;
      this.renderRoot = this.attachShadow({mode: 'open'});
    }
  
    /** Web component Lifecycle method. */
    connectedCallback() {
      this.renderRoot.appendChild(this._renderStyles());
      this.renderRoot.appendChild(this._renderContent());
    }
  
    /**
     * Render styles.
     * @return {HTMLElement!}
     */
    _renderStyles() {
      const styles = document.createElement('style');
      styles.textContent = `
  .wrapper {
  color: var(--df-messenger-default-text-color);
  }
  
  .title-link {
  text-decoration: none;
  color: var(--df-messenger-default-text-color);
  }
  
  .item-list {
  display: flex;
              width: 100%;
              gap: 15px;
  /* No flex wrap. */
  overflow-x: auto;
  }
  
  .item {
  width: 33%;
  padding: 14px;
  }
  
  .item-title {
  margin-top: 0;
              font-size: 1.2em;
              min-height: 50px;
  }
  
  .item-price {
  font-size: 1.2em;
              margin-top: 20px;
  }
  
  .item-image {
  border-radius: 8px;
              max-width: 250px;
              max-height: 250px;
              // box-shadow: 5px 0 20px 0 rgba(0, 0, 0, 0.1)
  }
  
  .item-description, .item-details {
  padding: 8px 0;
  }
  
  .item-table {
  font-size: var(--df-messenger-default-font-size);
  }
  
  .item-table td {
  padding: 2px 8px;
  }
  
  .title {
  display: none;
  }
  `;
      return styles;
    }
  
    /**
     * Render content.
     * @return {HTMLElement!}
     */
    _renderContent() {
      const content = document.createElement('div');
      content.classList.add('wrapper');
  
      const itemList = document.createElement('div');
      itemList.classList.add('item-list');
      for (const item of this.dfPayload.items) {
        itemList.appendChild(this._renderItem(item));
      }
  
      content.appendChild(itemList);
      return content;
    }
  
    /**
     * Render content.
     * @param {Object!} itemPayload
     * @return {HTMLElement!}
     */
    _renderItem(itemPayload) {
      let item = document.createElement('div');
      item.classList.add('item');
  
      console.log(itemPayload);
      const itemData = itemPayload.product;
      // console.log(itemData);
  
      let title = document.createElement('h2');
      title.classList.add('item-title');
      title.textContent = itemData.title;
  
      let imageWrapper = document.createElement('div');
  
      let image = document.createElement('img');
      image.classList.add('item-image');
      image.src = itemData.images[0].uri;
  
      imageWrapper.appendChild(image);
  
      let price = document.createElement('div');
      price.classList.add('item-price');
      if (itemData.priceInfo) {
        price.textContent = `${itemData.priceInfo.price} ${
            itemData.priceInfo.currencyCode || '$'}`;
      }
  
      let description;
      if (itemData.description) {
        description = document.createElement('div');
        description.classList.add('item-description');
        description.textContent = itemData.description;
      }
  
      let details;
      if (itemData.categories) {
        details = document.createElement('div');
        details.classList.add('item-details');
        details.textContent = itemData.categories;
      }
  
      item.appendChild(title);
      item.appendChild(imageWrapper);
      // if (itemData.description) {
      // item.appendChild(description); // uncomment to show the description
      // }
      if (itemData.categories) {
        item.appendChild(details);
      }
      if (itemData.priceInfo) {
        item.appendChild(price);
      }
      // item.appendChild(infoLink);
      return item;
    }
  }
  
  // Custom Template for rendering Customer Reviews.
  class ReviewTemplate extends HTMLElement {
    constructor() {
      super();
      this.dfPayload = null;
      this.dfResponseId = null;
      this.renderRoot = this.attachShadow({mode: 'open'});
    }
  
    /** Web component Lifecycle method. */
    connectedCallback() {
      this.renderRoot.appendChild(this._renderStyles());
      this.renderRoot.appendChild(this._renderContent());
    }
  
    /**
     * Render styles.
     * @return {HTMLElement!}
     */
    _renderStyles() {
      const styles = document.createElement('style');
      styles.textContent = `
              .wrapper {
                color: var(--df-messenger-default-text-color);
              }
  
              .title-link {
                text-decoration: none;
                color: var(--df-messenger-default-text-color);
              }
  
              .item-list {
                display: flex;
                width: 100%;
                gap: 15px;
                /* No flex wrap. */
                overflow-x: auto;
              }
  
              .item {
                width: 50%;
                background: #E8F0FE;
                border-radius: 15px;
                padding: 16px;
              }
  
              .review {
                background: #fff;
                border-radius: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                padding: 20px;
                // width: 30%; /* Adjust as necessary for your layout */
                // margin: 10px;
                box-sizing: border-box;
              }
  
              .review-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
              }
  
              .user-avatar {
                background-color: #0077CC;
                color: #fff;
                font-weight: bold;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
              }
  
              .user-info {
                flex-grow: 1;
              }
  
              .user-name {
                font-size: 1.1em;
                color: #333;
              }
  
              .user-rating {
                display: flex;
                align-items: center;
              }
  
              .stars {
                color: #FFD700;
                font-size: 1em;
              }
  
              .rating-score {
                font-size: 0.8em;
                color: #777;
                margin-left: 5px;
              }
  
              .review-text {
                font-size: 0.9em;
                color: #555;
              }
  
              .review-title {
              font-size: 0.9em;
              font-weight: bold;
                color: #555;
  
              }
  
              .review-text a {
                color: #0077CC;
                text-decoration: none;
              }
            `;
      return styles;
    }
  
    /**
     * Render content.
     * @return {HTMLElement!}
     */
    _renderContent() {
      const content = document.createElement('div');
      content.classList.add('wrapper');
  
      const itemList = document.createElement('div');
      itemList.classList.add('item-list');
      const numReviews = this.dfPayload.items.length;
      for (const item of this.dfPayload.items) {
        itemList.appendChild(this._renderItem(item, numReviews));
      }
  
      content.appendChild(itemList);
      return content;
    }
  
    /**
     * Render content.
     * @param {Object!} itemPayload
     * @param {number} numReviews
     * @return {HTMLElement!}
     */
    _renderItem(itemPayload, numReviews) {
      const item = document.createElement('div');
      console.log(itemPayload);
      // Clone our template node, replace the values, and re-insert into DOM.
      let revTemplate =
          document.getElementById('review-template').cloneNode(true);
      revTemplate.id = '';
      revTemplate.style.display = 'block';
      item.appendChild(revTemplate);
      let userAvatar = revTemplate.getElementsByClassName('user-avatar')[0];
      userAvatar.textContent = itemPayload.user[0];
      let userName = revTemplate.getElementsByClassName('user-name')[0];
      userName.textContent = itemPayload.user;
      let userRating = revTemplate.getElementsByClassName('rating-score')[0];
      userRating.textContent = '(' + itemPayload.rating + '/5)';
      let userDesc = revTemplate.getElementsByClassName('review-text')[0];
      userDesc.textContent = itemPayload.desc;
      let prodTitle = revTemplate.getElementsByClassName('review-title')[0];
      prodTitle.textContent = 'Item: ' + itemPayload.title;
      let stars = revTemplate.getElementsByClassName('stars')[0];
      let numFilled = itemPayload.rating;
      let numEmpty = 5 - numFilled;
      for (let i = 0; i < itemPayload.rating; i++) {
        stars.textContent += '★';
      }
      for (let i = 0; i < numEmpty; i++) {
        stars.textContent += '☆';
      }
      return item;
    }
  }
  
  // Enable custom elements.
  (function() {
  customElements.define('retail-template', RetailTemplate);
  customElements.define('review-template', ReviewTemplate);
  })();
  
  setupHtml();