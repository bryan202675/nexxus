import React from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useTheme } from "context/ThemeContext";

export default function FixedPlugin(props) {
  const { ...rest } = props;
  const { dark, toggleDark } = useTheme();

  return (
    <button
      type="button"
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      className="border-px fixed right-4 top-4 !z-[99] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[#6a53ff] bg-gradient-to-br from-brandLinear to-blueSecondary p-0 shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 md:bottom-[30px] md:right-[35px] md:top-auto md:h-[60px] md:w-[60px]"
      onClick={toggleDark}
      {...rest}
    >
      <div className="text-white">
        {dark ? (
          <RiSunFill className="h-5 w-5 text-white" />
        ) : (
          <RiMoonFill className="h-5 w-5 text-white" />
        )}
      </div>
    </button>
  );
}
