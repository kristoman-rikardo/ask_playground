import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="ask-min-h-screen ask-flex ask-items-center ask-justify-center ask-bg-gray-100">
      <div className="ask-text-center">
        <h1 className="ask-text-4xl ask-font-bold ask-mb-4">404</h1>
        <p className="ask-text-xl ask-text-gray-600 ask-mb-4">Oops! Page not found</p>
        <a href="/" className="ask-text-blue-500 ask-hover:text-blue-700 ask-underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
