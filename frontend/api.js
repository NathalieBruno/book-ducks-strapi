export const BASE_URL = "http://localhost:1337";
export const API_URL = `${BASE_URL}/api`;

export class Api {
  static getAuthHeader() {
    return sessionStorage.getItem("token") || null;
  }

  static async getBooks() {
    const response = await axios.get(`${API_URL}/books?populate=*`);
    return response.data.data;
  }

  static async login(email, password) {
    let response = await axios.post(`${API_URL}/auth/local`, {
      identifier: email,
      password: password,
    });
    if (response.status === 200) {
      sessionStorage.setItem("token", response.data.jwt);
    }
    return response.data;
  }

  static async isLoggedIn() {
    const token = this.getAuthHeader();
    console.log("Min token:", token);

    if (!token && window.location.pathname !== "/index.html") {
      window.location.href = "/index.html";
      return false;
    }

    return !!token;
  }

  static async register(username, email, password) {
    let response = await axios.post(`${API_URL}/auth/local/register`, {
      username: username,
      email: email,
      password: password,
    });
    return response.data;
  }

  static async addToWishlist(userId, bookId) {
    try {
      const token = this.getAuthHeader();
      if (!token) return false;

      await axios.post(
        `${API_URL}/wishlists`,
        {
          data: {
            user: userId,
            book: bookId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (err) {
      console.error("Fel vid tillägg av bok:", err);
      return false;
    }
  }

  static async checkWishlist(documentId, bookId) {
    try {
      const token = this.getAuthHeader();
      if (!token) return false;

      const response = await axios.get(
        `${API_URL}/wishlists?filters[user][documentId][$eq]=${documentId}&filters[book][documentId][$eq]=${bookId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data && response.data.data.length > 0;
    } catch (err) {
      return false;
    }
  }

  static async deleteWishlistItem(documentId) {
    try {
      const token = this.getAuthHeader();
      if (!token) {
        return false;
      }

      let response = await axios.delete(`${API_URL}/wishlists/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  static async getUserWishlist(userId) {
    try {
      const token = this.getAuthHeader();
      if (!token) return [];

      const response = await axios.get(`${API_URL}/wishlists?filters[user][documentId][$eq]=${userId}&populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data || [];
    } catch (err) {
      console.error("Fel vid hämtning av önskelista:", err);
      return [];
    }
  }

  static async getBookRating(bookId) {
    const response = await axios.get(`${API_URL}/ratings?filters[book][documentId][$eq]=${bookId}`);
    const ratings = response.data.data;
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  static async rateBook(userId, bookId, rating) {
    const token = this.getAuthHeader();
    if (!token) return false;

    const existingRating = await this.getUserBookRating(userId, bookId);

    if (existingRating) {
      await axios.put(
        `${API_URL}/ratings/${existingRating.documentId}`,
        { data: { rating } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        `${API_URL}/ratings`,
        { data: { user: userId, book: bookId, rating } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    return true;
  }

  static async getUserBookRating(userId, bookId) {
    const token = this.getAuthHeader();
    if (!token) return null;

    const response = await axios.get(
      `${API_URL}/ratings?filters[user][documentId][$eq]=${userId}&filters[book][documentId][$eq]=${bookId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data[0] || null;
  }

  static async getUserRatings(userId) {
    try {
      const token = this.getAuthHeader();
      if (!token) return [];

      const response = await axios.get(
        `${API_URL}/ratings?filters[user][documentId][$eq]=${userId}&populate[book][populate]=image`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.data || [];
    } catch (err) {
      console.error("Fel vid hämtning av betyg:", err);
      return [];
    }
  }

  static logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  }
}
