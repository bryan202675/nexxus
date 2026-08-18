/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "components/icons/DashIcon";
import { HiChevronDown } from "react-icons/hi";

function SidebarGroupItem({
  route,
  activeRoute,
  badges,
  locationPath,
}: {
  route: any;
  activeRoute: (path: string) => boolean;
  badges: Record<string, number>;
  locationPath: string;
}) {
  const isAnyChildActive = (route.items || []).some((item: any) =>
    activeRoute(item.path)
  );
  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  // Auto-expande si el usuario navega a una subruta dentro de esta categoría
  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [locationPath, isAnyChildActive]);

  const groupBadgeCount = (route.items || []).reduce((acc: number, item: any) => {
    return acc + (badges[item.path] || 0);
  }, 0);

  return (
    <div className="relative mb-2">
      {/* Cabecera del Acordeón / Grupo */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex w-full cursor-pointer items-center justify-between px-8 py-2 text-left transition-colors duration-150 hover:bg-gray-50/60 dark:hover:bg-white/5 rounded-lg"
      >
        <div className="flex items-center">
          <span
            className={`${
              isAnyChildActive
                ? "font-bold text-brand-500 dark:text-white"
                : "font-medium text-gray-600 dark:text-gray-400 group-hover:text-navy-700 dark:group-hover:text-white"
            }`}
          >
            {route.icon ? route.icon : <DashIcon />}
          </span>
          <p
            className={`leading-1 ml-4 text-base ${
              isAnyChildActive
                ? "font-bold text-navy-700 dark:text-white"
                : "font-medium text-gray-600 dark:text-gray-300 group-hover:text-navy-700 dark:group-hover:text-white"
            }`}
          >
            {route.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isOpen && groupBadgeCount > 0 ? (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {groupBadgeCount > 9 ? "9+" : groupBadgeCount}
            </span>
          ) : null}
          <HiChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400 group-hover:text-navy-700 dark:group-hover:text-white ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Submenú anidado con animación suave */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-1 pl-14 pr-6">
            {(route.items || []).map((subRoute: any, subIndex: number) => {
              const isSubActive = activeRoute(subRoute.path);
              const subBadge = badges[subRoute.path] || 0;

              return (
                <li key={subIndex} className="relative">
                  <Link
                    to={subRoute.layout + "/" + subRoute.path}
                    className="relative flex items-center justify-between py-2 text-sm transition-colors duration-150 hover:cursor-pointer"
                  >
                    <span
                      className={`${
                        isSubActive
                          ? "font-bold text-navy-700 dark:text-white"
                          : "font-medium text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {subRoute.name}
                    </span>

                    {subBadge > 0 ? (
                      <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {subBadge > 9 ? "9+" : subBadge}
                      </span>
                    ) : null}

                    {isSubActive ? (
                      <div className="absolute -right-6 top-1/2 -translate-y-1/2 h-7 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SidebarLinks(props: any) {
  const location = useLocation();
  const { routes, badges = {} } = props;

  // Verifica si el path es el activo en la URL
  const activeRoute = (routeName: string) => {
    return new RegExp(`(^|/)${routeName}(/|$)`).test(location.pathname);
  };

  const createLinks = (routesList: any[]) => {
    if (!Array.isArray(routesList)) return null;

    return routesList.map((route, index) => {
      // Si la ruta tiene subelementos (categoría colapsable)
      if (route.items && Array.isArray(route.items)) {
        return (
          <SidebarGroupItem
            key={index}
            route={route}
            activeRoute={activeRoute}
            badges={badges}
            locationPath={location.pathname}
          />
        );
      }

      // Elemento simple directo
      if (route.layout === "/admin") {
        const isActive = activeRoute(route.path);
        const badgeCount = badges[route.path] || 0;

        return (
          <Link key={index} to={route.layout + "/" + route.path}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li
                className="my-[3px] flex cursor-pointer items-center px-8"
                key={index}
              >
                <span
                  className={`${
                    isActive
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}
                </span>
                <p
                  className={`leading-1 ml-4 flex items-center gap-2 ${
                    isActive
                      ? "font-bold text-navy-700 dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.name}
                  {badgeCount > 0 ? (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  ) : null}
                </p>
              </li>
              {isActive ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
              ) : null}
            </div>
          </Link>
        );
      }

      return null;
    });
  };

  return createLinks(routes);
}

export default SidebarLinks;
