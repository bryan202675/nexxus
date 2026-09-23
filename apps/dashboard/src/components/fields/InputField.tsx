// Custom components
import React from "react";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

function InputField(props) {
  const { label, id, extra, type, placeholder, variant, state, disabled, ...rest } =
    props;
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (type === "password") {
      window.dispatchEvent(new CustomEvent('passwordVisibilityChanged', { detail: showPassword }));
    }
    // Cleanup if component unmounts while showing password
    return () => {
      if (type === "password" && showPassword) {
        window.dispatchEvent(new CustomEvent('passwordVisibilityChanged', { detail: false }));
      }
    };
  }, [showPassword, type]);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className={`${extra}`}>
      <label
        htmlFor={id}
        className={`text-sm text-navy-700 dark:text-white ${
          variant === "auth" ? "ml-1.5 font-medium" : "ml-3 font-bold"
        }`}
      >
        {label}
      </label>
      <div className="relative mt-2 flex items-center">
        <input
          disabled={disabled}
          type={inputType}
          id={id}
          placeholder={placeholder}
          className={`flex h-12 w-full items-center justify-center rounded-xl border bg-white/0 p-3 text-sm outline-none ${
            disabled === true
              ? "!border-none !bg-gray-100 dark:!bg-white/5 dark:placeholder:!text-[rgba(255,255,255,0.15)]"
              : state === "error"
              ? "border-red-500 text-red-500 placeholder:text-red-500 dark:!border-red-400 dark:!text-red-400 dark:placeholder:!text-red-400"
              : state === "success"
              ? "border-green-500 text-green-500 placeholder:text-green-500 dark:!border-green-400 dark:!text-green-400 dark:placeholder:!text-green-400"
              : "border-gray-200 dark:!border-white/10 dark:text-white"
          } ${type === "password" ? "pr-10" : ""}`}
          {...rest}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default InputField;
