import axios from "axios";

for (let i = 0; i < 100; i++) {
  axios
    .patch("http://localhost:8000/posts/63769c0e0587d958d1ceb1ed/like", {
      user_id: "637694ad461be06b1845fe01",
      action: Math.random() > 0.5 ? "like" : "unlike",
    })
    .then((res) => {
      console.log(res.data.message);
    })
    .catch((err) => {
      console.log(err);
    });
}
