let userData = {};
let userAllTasks = [];
let userSkills = [];
let userStatusData = {};
let currentPageIndex = 1;
let taskPerPage = 3;
let totalPages = Math.ceil(userAllTasks.length / taskPerPage);
const username = new URLSearchParams(window.location.search).get('username');

function createElement({ type, classList = [] }) {
  const element = document.createElement(type);
  element.classList.add(...classList);
  return element;
}

function createTextNode(text) {
  return document.createTextNode(text);
}

function removeElementClass(element, className) {
  element.classList.remove(className);
}

function showLoader(selector) {
  const loader = createElement({ type: 'div', classList: ['loader'] });
  loader.appendChild(createTextNode('Loading...'));
  document.querySelector(selector).appendChild(loader);
}

function hideLoader(selector) {
  const container = document.querySelector(selector);
  if (container.hasChildNodes()) {
    container.firstElementChild.remove();
  }
}

async function getUserData() {
  showLoader('.user-details-header');
  try {
    const res = await makeApiCall(`${API_BASE_URL}/users/${username}`);
    if (res.status === 200) {
      const data = await res.json();
      userData = data.user;
      hideLoader('.user-details-header');
      generateUserData(data.user);
      removeElementClass(document.querySelector('.accordion'), 'hide');
    }
  } catch (err) {
    console.log(err);
    hideLoader('.user-details-header');
    const errorEl = createElement({ type: 'p', classList: ['error'] });
    errorEl.appendChild(createTextNode('Something Went Wrong!'));
    const container = document.querySelector('.user-details-header');
    container.appendChild(errorEl);
  }
}

function generateUserImage(alt) {
  const img = createElement({ type: 'img' });
  img.src = userData.img ? userData.img : defaultAvatar;
  img.setAttribute('alt', alt);
  return img;
}

function createSocialMediaAnchorNode({ href, id, alt, src }) {
  const a = createElement({ type: 'a', classList: ['social'] });
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
  a.setAttribute('href', `${href}/${userData[id] ? userData[id] : ''}`);

  const p = createElement({ type: 'p' });
  p.appendChild(createTextNode(alt));

  const img = createElement({ type: 'img' });
  img.src = src;
  img.setAttribute('alt', alt);

  a.append(img, p);

  return a;
}

function generateSocialMediaLinksList() {
  const div = createElement({
    type: 'div',
    classList: ['user-details-social'],
  });

  socialMedia.forEach((item) => {
    const link = createSocialMediaAnchorNode({ ...iconMapper[item], id: item });
    div.appendChild(link);
  });

  return div;
}

function generateUserData(userData) {
  const main = createElement({
    type: 'div',
    classList: ['user-details-main'],
  });
  const wrapper = createElement({
    type: 'div',
    classList: ['user-details-wrap'],
  });
  const username = createElement({
    type: 'h2',
    classList: ['user-details-username'],
  });
  username.appendChild(createTextNode(userData.username));

  const img = generateUserImage('profile');
  const socials = generateSocialMediaLinksList();
  wrapper.append(img, username);
  main.append(wrapper, socials);
  document.querySelector('.user-details-header').appendChild(main);
  toggleAccordionTabsVisibility();
  generateAcademicTabDetails();
}

function toggleAccordionTabsVisibility() {
  const accordionTabs = document
    .querySelector('.accordion')
    .querySelectorAll('.visible-content');
  accordionTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const hiddenContent = tab.nextElementSibling;
      const arrowIcon = tab.querySelector('img');
      if (hiddenContent) {
        arrowIcon.classList.toggle('open');
        hiddenContent.classList.toggle('hide');
      }
    });
  });
}

function generateAcademicTabDetails() {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });
  const divOne = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleOne = createElement({ type: 'h3' });
  titleOne.appendChild(createTextNode('College / Company'));
  const company = createElement({
    type: 'p',
    classList: ['user-details-company'],
  });
  company.appendChild(createTextNode(userData.company));

  divOne.append(titleOne, company);

  const divTwo = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleTwo = createElement({ type: 'h3' });
  titleTwo.appendChild(createTextNode('Current Year'));
  const yoe = createElement({
    type: 'p',
    classList: ['user-details-yoe'],
  });
  yoe.appendChild(createTextNode(userData.yoe));

  divTwo.append(titleTwo, yoe);
  div.append(divOne, divTwo);

  document.querySelector('.accordion-academic').appendChild(div);
}

function generateTasksTabDetails() {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });
  const tasks = createElement({ type: 'div', classList: ['user-tasks'] });
  const pagination = createElement({ type: 'div', classList: ['pagination'] });
  const prevBtn = createElement({
    type: 'button',
    classList: ['pagination-prev-page'],
  });
  prevBtn.appendChild(createTextNode('Prev'));
  prevBtn.addEventListener('click', fetchPrevTasks);
  const nextBtn = createElement({
    type: 'button',
    classList: ['pagination-next-page'],
  });
  nextBtn.appendChild(createTextNode('Next'));
  nextBtn.addEventListener('click', fetchNextTasks);

  pagination.append(prevBtn, nextBtn);
  div.append(tasks, pagination);
  document.querySelector('.accordion-tasks').appendChild(div);
}

async function getUserTasks() {
  try {
    const res = await makeApiCall(`${API_BASE_URL}/tasks/${username}`);
    if (res.status === 200) {
      const data = await res.json();
      userAllTasks = data.tasks;
      totalPages = Math.ceil(userAllTasks.length / taskPerPage);
      const tasks = getTasksToFetch(userAllTasks, currentPageIndex);
      generateTasksTabDetails();
      generateUserTaskList(tasks);
      getUserSkills();
      getUserAvailabilityStatus();
    }
  } catch (err) {
    const div = createElement({
      type: 'div',
      classList: ['hidden-content', 'hide'],
    });
    const errorEl = createElement({ type: 'p', classList: ['error'] });
    errorEl.appendChild(createTextNode('Something Went Wrong!'));
    div.appendChild(errorEl);
    document.querySelector('.accordion-tasks').appendChild(div);
  }
}

function getTasksToFetch(userTasks, currentIndex) {
  const startIndex = currentIndex * taskPerPage - taskPerPage;
  const endIndex = currentIndex * taskPerPage;
  return userTasks.filter(
    (_, index) => index >= startIndex && index < endIndex,
  );
}

function generateUserTaskList(userTasks) {
  document.querySelector('.user-tasks').innerHTML = '';
  if (!userTasks.length) {
    const errorEl = createElement({ type: 'p', classList: ['error'] });
    errorEl.appendChild(createTextNode('No Data Found'));
    const container = document.querySelector(
      '.accordion-tasks > .hidden-content',
    );
    container.innerHTML = '';
    container.appendChild(errorEl);
  } else {
    userTasks.forEach((task) => {
      const taskCard = createSingleTaskCard(task);
      document.querySelector('.user-tasks').appendChild(taskCard);
    });

    if (currentPageIndex === 1) {
      document.querySelector('.pagination-prev-page').disabled = true;
    } else {
      document.querySelector('.pagination-prev-page').disabled = false;
    }

    if (currentPageIndex === totalPages) {
      document.querySelector('.pagination-next-page').disabled = true;
    } else {
      document.querySelector('.pagination-next-page').disabled = false;
    }
  }
}

function createSingleTaskCard(task) {
  const container = createElement({ type: 'div', classList: ['user-taks'] });
  const h2 = createElement({ type: 'h2', classList: ['task-title'] });
  h2.appendChild(createTextNode(task?.title));
  const p = createElement({ type: 'p', classList: ['task-description'] });
  p.appendChild(createTextNode(task?.purpose));
  const div = createElement({ type: 'div', classList: ['task-details'] });

  const dueDate = createElement({ type: 'div', classList: ['hidden-details'] });
  const dueDateTitle = createElement({ type: 'h3' });
  dueDateTitle.appendChild(createTextNode('Due Date'));
  const dueDateValue = createElement({ type: 'p' });
  dueDateValue.appendChild(createTextNode(task.endsOn));
  dueDate.append(dueDateTitle, dueDateValue);

  const status = createElement({ type: 'div', classList: ['hidden-details'] });
  const statusTitle = createElement({ type: 'h3' });
  statusTitle.appendChild(createTextNode('Status'));
  const statusValue = createElement({ type: 'p' });
  statusValue.appendChild(createTextNode(task.status));
  status.append(statusTitle, statusValue);

  div.append(dueDate, status);
  container.append(h2, p, div);
  return container;
}

function fetchPrevTasks() {
  if (currentPageIndex > 1) {
    currentPageIndex--;
    const tasks = getTasksToFetch(userAllTasks, currentPageIndex);
    generateUserTaskList(tasks);
  }
}

function fetchNextTasks() {
  if (currentPageIndex < totalPages) {
    currentPageIndex++;
    const tasks = getTasksToFetch(userAllTasks, currentPageIndex);
    generateUserTaskList(tasks);
  }
}

async function getUserSkills() {
  try {
    const res = await makeApiCall(
      `${API_BASE_URL}/users/${userData?.id}/skills`,
    );
    if (res.status === 200) {
      const data = await res.json();
      userSkills = data.skills;
      generateSkillsTabDetails(userSkills);
    }
  } catch (err) {
    console.error(err);
  }
}

function generateSkillsTabDetails(skills) {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });

  if (skills.length) {
    skills.forEach((skill) => {
      const skillContainer = createElement({
        type: 'div',
        classList: ['skill-container', 'hidden-details'],
      });
      const skillName = createElement({ type: 'h3' });
      const skillLevel = createElement({
        type: 'span',
      });
      skillLevel.appendChild(createTextNode(`Level ${skill.levelValue}`));
      skillName.appendChild(createTextNode(`${skill.tagName}`));
      skillContainer.append(skillName, skillLevel);
      div.append(skillContainer);
    });
  } else {
    div.appendChild(createTextNode('No skills to show!'));
  }

  document.querySelector('.accordion-skills').append(div);
}

async function getUserAvailabilityStatus() {
  try {
    const res = await makeApiCall(
      `${API_BASE_URL}/users/status/${userData?.id}`,
    );
    if (res.status === 200) {
      const data = await res.json();
      userStatusData = data.data;
      generateAvalabilityTabDetails(userStatusData.currentStatus.state);
    }
  } catch (err) {
    console.error(err);
  }
}

function generateAvalabilityTabDetails(state) {
  if (state === 'OOO') {
    generateUserOOODetails();
  } else if (state === 'IDLE') {
    generateUserIdleDetails();
  } else {
    generateUserActiveDetails();
  }
}

function getMonth(index) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[index];
}

function getDateFromTimestamp(timestamp) {
  const newDate = new Date(timestamp * 1000);
  const date = newDate.getDate();
  const month = newDate.getMonth();
  const year = newDate.getFullYear();

  return `${date}th ${getMonth(month)} ${year}`;
}

function getDiffrenceBetweenTimestamps(timestampOne, timestampTwo) {
  const diff = timestampOne - timestampTwo;
  const days = diff / 60 / 60 / 24;
  return Math.ceil(days).toFixed(0);
}

function calculateRemainingActiveMonthlyHours(totalHours) {
  const currentDate = new Date().getDate();
  const daysRemaining = 30 - currentDate;
  const hoursCommittedDaily = totalHours / 30;
  const remainingHours = daysRemaining * hoursCommittedDaily;
  return remainingHours.toFixed(1);
}

function generateUserActiveDetails() {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });

  const divOne = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleOne = createElement({ type: 'h3' });
  titleOne.appendChild(createTextNode('Current Status'));
  const currentStatus = createElement({
    type: 'p',
  });
  currentStatus.appendChild(
    createTextNode(`${userStatusData.currentStatus.state}`),
  );
  divOne.append(titleOne, currentStatus);

  const divTwo = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleTwo = createElement({ type: 'h3' });
  titleTwo.appendChild(createTextNode('From'));
  const activeFrom = createElement({ type: 'p' });
  activeFrom.appendChild(
    createTextNode(
      `${getDateFromTimestamp(userStatusData.currentStatus.from._seconds)}`,
    ),
  );
  divTwo.append(titleTwo, activeFrom);

  const divThree = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleThree = createElement({ type: 'h3' });
  titleThree.appendChild(
    createTextNode(
      `No Of Hours alloted for ${getMonth(new Date().getMonth())} 2022`,
    ),
  );
  const hoursAlloted = createElement({ type: 'p' });
  hoursAlloted.appendChild(
    createTextNode(`${userStatusData.monthlyHours.commited}`),
  );
  divThree.append(titleThree, hoursAlloted);

  const divFour = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleFour = createElement({
    type: 'h3',
    classList: ['hidden-details'],
  });
  titleFour.appendChild(createTextNode('Approx no of hours remaining'));
  const hoursRemaining = createElement({ type: 'p' });
  hoursRemaining.appendChild(
    createTextNode(
      `${calculateRemainingActiveMonthlyHours(
        userStatusData.monthlyHours.commited,
      )} Hours`,
    ),
  );
  divFour.append(titleFour, hoursRemaining);

  div.append(divOne, divTwo, divThree, divFour);

  document.querySelector('.accordion-availability').append(div);
}

function generateUserOOODetails() {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });

  const divOne = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleOne = createElement({ type: 'h3' });
  titleOne.appendChild(createTextNode('Current Status'));
  const currentStatus = createElement({
    type: 'p',
  });
  currentStatus.appendChild(
    createTextNode(`${userStatusData.currentStatus.state}`),
  );
  divOne.append(titleOne, currentStatus);

  const divTwo = createElement({ type: 'div', classList: ['hidden-details'] });
  const titleTwo = createElement({ type: 'h3' });
  titleTwo.appendChild(createTextNode('From'));
  const oooSince = createElement({ type: 'p' });
  oooSince.appendChild(
    createTextNode(
      `${getDateFromTimestamp(userStatusData.currentStatus.from._seconds)}`,
    ),
  );
  divTwo.append(titleTwo, oooSince);

  const divThree = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleThree = createElement({
    type: 'h3',
  });
  titleThree.appendChild(createTextNode('Until'));
  const returnDate = createElement({ type: 'p' });
  returnDate.appendChild(
    createTextNode(
      `${getDateFromTimestamp(userStatusData.currentStatus.until._seconds)}`,
    ),
  );
  divThree.append(titleThree, returnDate);

  const divFour = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleFour = createElement({
    type: 'h3',
    classList: ['hidden-details'],
  });
  titleFour.appendChild(createTextNode('Reason'));
  const oooReason = createElement({ type: 'p' });
  oooReason.appendChild(
    createTextNode(`${userStatusData.currentStatus.message}`),
  );
  divFour.append(titleFour, oooReason);

  div.append(divOne, divTwo, divThree, divFour);

  document.querySelector('.accordion-availability').append(div);
}

function generateUserIdleDetails() {
  const div = createElement({
    type: 'div',
    classList: ['hidden-content', 'hide'],
  });

  const divOne = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleOne = createElement({ type: 'h3' });
  titleOne.appendChild(createTextNode('Current Status'));
  const currentStatus = createElement({
    type: 'p',
  });
  currentStatus.appendChild(
    createTextNode(`${userStatusData.currentStatus.state}`),
  );
  divOne.append(titleOne, currentStatus);

  const divTwo = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleTwo = createElement({ type: 'h3' });
  titleTwo.appendChild(createTextNode('From'));
  const idleFrom = createElement({
    type: 'p',
  });
  idleFrom.appendChild(
    createTextNode(
      `${getDateFromTimestamp(userStatusData.currentStatus.from._seconds)}`,
    ),
  );
  divTwo.append(titleTwo, idleFrom);

  const divThree = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleThree = createElement({ type: 'h3' });
  titleThree.appendChild(createTextNode('Skills you are looking to learn'));
  const skills = createElement({
    type: 'p',
  });
  skills.appendChild(createTextNode(`${userSkills.toString()}`));
  divThree.append(titleThree, skills);

  const divFour = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleFour = createElement({ type: 'h3' });
  titleFour.appendChild(
    createTextNode(
      `No Of Hours alloted for ${getMonth(new Date().getMonth())} 2022`,
    ),
  );
  const hoursAlloted = createElement({ type: 'p' });
  hoursAlloted.appendChild(
    createTextNode(`${userStatusData.monthlyHours.commited}`),
  );
  divFour.append(titleFour, hoursAlloted);

  const divFive = createElement({
    type: 'div',
    classList: ['hidden-details'],
  });
  const titleFive = createElement({
    type: 'h3',
    classList: ['hidden-details'],
  });
  titleFive.appendChild(createTextNode('Approx no of hours remaining'));
  const hoursRemaining = createElement({ type: 'p' });
  hoursRemaining.appendChild(
    createTextNode(
      `${calculateRemainingActiveMonthlyHours(
        userStatusData.monthlyHours.commited,
      )} Hours`,
    ),
  );
  divFive.append(titleFive, hoursRemaining);

  div.append(divOne, divTwo, divThree, divFour, divFive);

  document.querySelector('.accordion-availability').append(div);
}

function showProtectedRouteErrorMessage() {
  const div = createElement({ type: 'div', classList: ['error-dialog'] });
  const content = createElement({ type: 'div', classList: ['error-content'] });
  const overlay = createElement({ type: 'div', classList: ['error-overlay'] });
  const h3 = createElement({ type: 'h3' });
  h3.appendChild(
    createTextNode('You are not authorised to access this route!'),
  );
  const btn = createElement({ type: 'button' });
  btn.appendChild(createTextNode('Go Back'));
  btn.addEventListener('click', () => {
    window.history.back();
  });
  content.append(h3, btn);
  div.append(overlay, content);
  document.querySelector('body').appendChild(div);
}

function showContent() {
  const section1 = document.querySelector('.header');
  const section2 = document.querySelector('#main-section');
  const section3 = document.querySelector('footer');
  section1.classList.remove('hide');
  section2.classList.remove('hide');
  section3.classList.remove('hide');
}

async function init() {
  const isSuperUser = await checkUserIsSuperUser();
  if (isSuperUser) {
    showContent();
    getUserData();
    getUserTasks();
  } else {
    showProtectedRouteErrorMessage();
  }
}

init();
