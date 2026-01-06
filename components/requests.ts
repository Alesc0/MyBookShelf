const headers = new Headers({
  "User-Agent": "MyBookShelf/0.1 (pedroalexandreftw@gmail.com)",
});
const options = {
  method: "GET",
  headers: headers,
};

export default async function make_req(url: string) {
  const req = await fetch(url, options);
  return req.json();
}
