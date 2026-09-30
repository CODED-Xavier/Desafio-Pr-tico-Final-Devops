import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1', // Aqui vcs vejam qual porta a API de vcs vai está rodando
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.details?.map((d) => d.message).join(', ') ||
      'Erro inesperado. Tente novamente.';

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.code = error.response?.data?.code;
    enhancedError.details = error.response?.data?.details;
    return Promise.reject(enhancedError);
  }
);

export default api;
