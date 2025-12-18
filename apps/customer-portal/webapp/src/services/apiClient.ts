import axios, { type InternalAxiosRequestConfig } from "axios";
import { refreshToken, getIdToken } from "./auth";

// Variables/constants
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

// Holds the refresh token promise
// let refreshTokenPromise: Promise<string | null> | null = null; // Unused for now

// axios instance
const apiClient = axios.create({});

/**
 * Request Interceptor
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log the outgoing request
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${
        config.baseURL || ""
      }${config.url || ""}`,
      {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        headers: config.headers,
      }
    );
    // Token
    const token = getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";

    return config;
  },
  (error) => {
    console.error("Request interceptor error", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const generateCurl = (config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase() || "GET";
  const url = `${config.baseURL || ""}${config.url || ""}`;
  const headers = config.headers;
  const data = config.data;

  let curl = `curl -X ${method} '${url}'`;

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value && typeof value === "string") {
        curl += ` -H '${key}: ${value}'`;
      } else if (value && typeof value === "object" && "toString" in value) {
        // Handle cases where header value might be an object with toString (like AxiosHeaders in some contexts, though usually it behaves like a map)
        // But for safety, let's just use what's safe.
        // In Axios v1, headers are AxiosHeaders which have a valid toJSON/forEach.
        // Simpler to just trust it behaves iterably or we access it directly if we knew the version.
        // For now, let's assume simple string/number values or standard object iteration works for headers.
        curl += ` -H '${key}: ${value}'`;
      }
    });
  }

  if (data) {
    try {
      const body = typeof data === "string" ? data : JSON.stringify(data);
      curl += ` -d '${body}'`;
    } catch (e) {
      // ignore serialization errors
    }
  }

  return curl;
};

apiClient.interceptors.response.use(
  (response) => {
    const curl = generateCurl(response.config);
    console.log(
      `Successful response from ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`,
      {
        status: response.status,
        curl,
      }
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest) {
      console.error("Failed Request Curl:", generateCurl(originalRequest));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("Received 401 unauthorized, attempting token refresh");

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshToken();
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;