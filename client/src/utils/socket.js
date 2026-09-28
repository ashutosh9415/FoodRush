import {
  io,
} from "socket.io-client";

const socket =
  io(
    "https://foodrush-1q1y.onrender.com",
    {
      withCredentials: true,
    }
  );

export default socket;
