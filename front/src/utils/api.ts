import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export const getToken = () => localStorage.getItem("access");
export const getRefresh = () => localStorage.getItem("refresh");
export const setTokenPair = (access: string, refresh?: string) => {
  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
};
export const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

// Ajout du token à chaque requête
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Refresh automatique
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        await new Promise<void>((ok) => queue.push(ok));
        original.headers.Authorization = `Bearer ${getToken()}`;
        original._retry = true;
        return api(original);
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const r = getRefresh();
        if (!r) throw new Error("no refresh");
        const { data } = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh: r });
        setTokenPair(data.access); // conserve refresh existant
        queue.forEach((ok) => ok());
        queue = [];
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
