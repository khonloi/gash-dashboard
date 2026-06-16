import { useCallback } from 'react';

export const useErrorHandler = () => {
    const handleApiError = useCallback((err, defaultMessage = "An error occurred") => {
        if (err?.response?.data?.message) {
            return err.response.data.message;
        } else if (err?.response?.status === 403) {
            return "Access denied. Only admin and manager can perform this action";
        } else if (err?.response?.status === 401) {
            return "You are not authorized to perform this action";
        } else if (err?.response?.status === 404) {
            return "Resource not found";
        } else if (err?.response?.status >= 500) {
            return "Server error. Please try again later";
        } else if (err?.message) {
            return err.message;
        }
        return defaultMessage;
    }, []);

    return { handleApiError };
};

export default useErrorHandler;
