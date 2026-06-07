export const saveAuth = (token, user) => {
  localStorage.setItem("onboardpro_token", token);
  localStorage.setItem("onboardpro_user", JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem("onboardpro_token");
};

export const getUser = () => {
  const user = localStorage.getItem("onboardpro_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("onboardpro_token");
  localStorage.removeItem("onboardpro_user");
};

export const getDashboardPath = (role) => {
  if (role === "hr") {
    return "/hr-dashboard";
  }

  if (role === "manager") {
    return "/manager-dashboard";
  }

  if (role === "employee") {
    return "/employee-dashboard";
  }

  return "/login";
};

export const isLoggedIn = () => {
  return Boolean(getToken() && getUser());
};