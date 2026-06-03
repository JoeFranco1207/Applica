export const useTranslate = (text, opts = {}) => {
  return {
    translated: text,
    loading: false,
    error: null,
    translateNow: async (t) => t,
  };
};

export default useTranslate;

