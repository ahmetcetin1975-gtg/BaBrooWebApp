export function apiRoot() {
  return (
    process.env.API_ROOT ||
    process.env.NEXT_PUBLIC_API_ROOT ||
    "http://127.0.0.1:8081"
  ).replace(/\/$/, "");
}
