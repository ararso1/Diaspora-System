import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const loginUser = async (identifier: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      identifier,
      password,
    });
    console.log("Login successful", response.data);
    return response.data; // contains JWT token
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    console.log("Registration successful", response.data);
    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await axios.get(`${API_URL}/logout/`);
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    // proceed anyway; client will clear token
  }
};