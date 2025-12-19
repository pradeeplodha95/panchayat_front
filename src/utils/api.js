import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Custom fetch wrapper that handles authentication and trial expiration
export const apiFetch = async (url, options = {}, navigate, toast) => {
  const token = localStorage.getItem("token");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    // Handle trial expiration
    if (response.status === 403 && data.trialExpired) {
      toast({
        title: "Trial Expired",
        description: data.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setTimeout(() => navigate("/login"), 2000);
      throw new Error("Trial expired");
    }

    // Handle other auth errors
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      navigate("/login");
      throw new Error("Unauthorized");
    }

    return { response, data };
  } catch (error) {
    if (error.message !== "Trial expired" && error.message !== "Unauthorized") {
      console.error("API Error:", error);
    }
    throw error;
  }
};

// Hook to use apiFetch with navigation and toast
export const useApiFetch = () => {
  const navigate = useNavigate();
  const toast = useToast();

  return (url, options) => apiFetch(url, options, navigate, toast);
};