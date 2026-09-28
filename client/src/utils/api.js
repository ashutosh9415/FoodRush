import axios from "axios";

const api =
  axios.create({
    baseURL:
      "https://foodrush-1q1y.onrender.com",

    withCredentials: true,
  });

export default api;
