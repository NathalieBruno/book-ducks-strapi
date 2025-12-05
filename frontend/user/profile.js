import { Api, BASE_URL } from "../api.js";
import { applyTheme } from "../theme.js";

await Api.isLoggedIn();

toastr.options = {
  positionClass: "toast-bottom-right",
  toastClass: "toast toast--custom",
};

const sortTitleBtn = document.getElementById("sort-title");
const sortAuthorBtn = document.getElementById("sort-author");
const sortRatingTitleBtn = document.getElementById("sort-rating-title");
const sortRatingAuthorBtn = document.getElementById("sort-rating-author");
const sortRatingRatingBtn = document.getElementById("sort-rating-rating");

let userWishlist = [];
let originalWishlist = [];
let userRatings = [];
let originalRatings = [];

const getUserWishlist = async () => {
  const response = await axios.get(`${BASE_URL}/api/users/me?pLevel=4`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  userWishlist = response.data.wishlists;

  return { wishlist: userWishlist };
};

const getUserRatings = async () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  userRatings = await Api.getUserRatings(user.documentId);
  return userRatings;
};

const sortWishlist = (sortBy, buttonId, otherButtonId) => {
  const activeBtn = document.getElementById(buttonId);

  if (activeBtn.classList.contains("active")) {
    userWishlist = [...originalWishlist];
    renderWishlist();
    activeBtn.classList.remove("active");
    return;
  }

  userWishlist.sort((a, b) => {
    const valueA = a.book[sortBy].toLowerCase().trim();
    const valueB = b.book[sortBy].toLowerCase().trim();
    return valueA.localeCompare(valueB, "sv");
  });

  renderWishlist();
  activeBtn.classList.add("active");
  document.getElementById(otherButtonId).classList.remove("active");
};

const sortRatings = (sortBy, buttonId) => {
  const activeBtn = document.getElementById(buttonId);

  if (activeBtn.classList.contains("active")) {
    userRatings = [...originalRatings];
    renderRatings();
    sortRatingTitleBtn?.classList.remove("active");
    sortRatingAuthorBtn?.classList.remove("active");
    sortRatingRatingBtn?.classList.remove("active");
    return;
  }

  if (sortBy === "rating") {
    userRatings.sort((a, b) => b.rating - a.rating);
  } else {
    userRatings.sort((a, b) => {
      const valueA = a.book[sortBy].toLowerCase().trim();
      const valueB = b.book[sortBy].toLowerCase().trim();
      return valueA.localeCompare(valueB, "sv");
    });
  }

  renderRatings();

  sortRatingTitleBtn?.classList.remove("active");
  sortRatingAuthorBtn?.classList.remove("active");
  sortRatingRatingBtn?.classList.remove("active");
  activeBtn.classList.add("active");
};

const renderWishlist = () => {
  const container = document.getElementById("wishlist-container");
  container.innerHTML = "";

  if (userWishlist.length === 0) {
    container.innerHTML = "<p>Din önskelista är tom.</p>";
    return;
  }

  userWishlist.forEach((book) => {
    container.append(createBookCard(book));
  });
};

const renderRatings = () => {
  const container = document.getElementById("ratings-container");
  container.innerHTML = "";

  if (userRatings.length === 0) {
    container.innerHTML = "<p>Du har inte betygsatt några böcker än.</p>";
    return;
  }

  userRatings.forEach((rating) => {
    container.append(createRatingCard(rating));
  });
};

const loadBooks = async () => {
  const books = await getUserWishlist();
  userWishlist = books.wishlist;
  originalWishlist = [...userWishlist];

  await getUserRatings();
  originalRatings = [...userRatings];

  renderWishlist();
  renderRatings();
};

const createBookCard = (book) => {
  const card = document.createElement("div");
  card.className = "book-card logged-in";
  card.innerHTML = `
      <div class="book-cover-container">
        <img src="${BASE_URL}${book.book.image?.url}"class="book-cover">
      </div>
      <div class="book-info">
        <h3 class="book-title">${book.book.title}</h3>
        <p class="book-author">${book.book.author}</p>
        <p class="book-details">Sidor: ${book.book.pages}</p>
        <p class="book-details">Publicerad: ${book.book.publicationDate}</p>
      </div>
      <div class="button-container"></div>
      
    `;

  if (sessionStorage.getItem("token")) {
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Ta bort från listan";
    removeBtn.className = "book-action-btn remove-from-wishlist";

    const buttonContainer = card.querySelector(".button-container");
    buttonContainer.append(removeBtn);

    const wishlistId = book.documentId;

    removeBtn.addEventListener("click", function () {
      if (confirm("Är du säker på att du vill ta bort boken från din önskelista?")) {
        Api.deleteWishlistItem(wishlistId).then((success) => {
          if (success) {
            toastr.success("Boken har tagits bort!");
            const filterById = (id) => (item) => item.documentId !== id;
            originalWishlist = originalWishlist.filter(filterById(wishlistId));
            userWishlist = userWishlist.filter(filterById(wishlistId));
            renderWishlist();
          } else {
            toastr.error("Kunde inte ta bort boken, försök igen");
          }
        });
      }
    });
  }

  return card;
};

const createRatingCard = (ratingData) => {
  const book = ratingData.book;
  const rating = ratingData.rating;
  const card = document.createElement("div");
  card.className = "book-card logged-in";
  card.innerHTML = `
      <div class="book-cover-container">
        <img src="${BASE_URL}${book.image?.url}" class="book-cover">
      </div>
      <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <p class="book-details">Sidor: ${book.pages}</p>
        <p class="book-details">Publicerad: ${book.publicationDate}</p>
        <p class="book-rating" style="font-size: 18px;"><strong>Ditt betyg: ${rating}</strong></p>
      </div>
    `;

  return card;
};

window.toggleSection = function (section) {
  const content = document.getElementById(`${section}-content`);
  const icon = document.getElementById(`${section}-icon`);

  content.classList.toggle("collapsed");
  content.classList.toggle("expanded");
  icon.classList.toggle("collapsed");
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
});

sortTitleBtn.addEventListener("click", () => sortWishlist("title", "sort-title", "sort-author"));
sortAuthorBtn.addEventListener("click", () => sortWishlist("author", "sort-author", "sort-title"));
sortRatingTitleBtn.addEventListener("click", () => sortRatings("title", "sort-rating-title"));
sortRatingAuthorBtn.addEventListener("click", () => sortRatings("author", "sort-rating-author"));
sortRatingRatingBtn.addEventListener("click", () => sortRatings("rating", "sort-rating-rating"));

loadBooks();
