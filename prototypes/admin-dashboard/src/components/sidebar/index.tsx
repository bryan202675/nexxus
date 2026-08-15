/* eslint-disable */

import { HiX } from 'react-icons/hi';
import { MdMenuOpen, MdMenu } from 'react-icons/md';
import Links from './components/Links';

import SidebarCard from 'components/sidebar/components/SidebarCard';
import { IRoute } from 'types/navigation';

function SidebarHorizon(props: { routes: IRoute[]; isCollapsed: boolean; setIsCollapsed: (val: boolean) => void; [x: string]: any }) {
  const { routes, open, setOpen, isCollapsed, setIsCollapsed } = props;
  return (
    <div
      className={`sm:none duration-300 linear fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 overflow-x-hidden ${
        open ? 'translate-x-0' : '-translate-x-96 xl:translate-x-0'
      } ${isCollapsed ? 'w-[100px]' : 'w-[285px]'}`}
    >
      <span
        className="absolute right-4 top-4 block cursor-pointer xl:hidden"
        onClick={() => setOpen(false)}
      >
        <HiX />
      </span>

      <div className={`mx-[20px] mt-[50px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div 
          className="group relative flex cursor-pointer items-center gap-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {/* Box logo with hover overlay */}
          <div className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-brand-500 text-white transition-all ${isCollapsed ? 'h-10 w-10 text-xl' : 'h-8 w-8 text-lg'}`}>
            <span className="transition-opacity duration-300 group-hover:opacity-0 font-bold">N</span>
            <div className="absolute inset-0 flex items-center justify-center bg-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {isCollapsed ? <MdMenu className="h-6 w-6" /> : <MdMenuOpen className="h-5 w-5" />}
            </div>
          </div>
          
          {/* Text part, hidden if collapsed */}
          <div className={`font-poppins text-[26px] font-bold uppercase text-navy-700 dark:text-white transition-all ${isCollapsed ? 'opacity-0 w-0 overflow-hidden hidden' : 'opacity-100 w-auto'}`}>
            NEXXUS
          </div>
        </div>
      </div>
      <div className="mb-7 mt-[58px] h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} isCollapsed={isCollapsed} />
      </ul>

      {/* Free Horizon Card */}
      {!isCollapsed && (
        <div className="flex justify-center transition-all duration-300">
          <SidebarCard />
        </div>
      )}

      {/* Nav item end */}
    </div>
  );
}

export default SidebarHorizon;
